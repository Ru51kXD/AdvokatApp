import { db } from '../database/database';

export const RequestService = {
  // Create a new request
  createRequest: (clientId, requestData) => {
    const { title, description, law_area, price_range, experience_required } = requestData;

    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            `INSERT INTO requests 
             (client_id, title, description, law_area, price_range, experience_required) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [clientId, title, description, law_area, price_range, experience_required],
            (_, { insertId }) => {
              resolve(insertId);
            },
            (_, error) => {
              reject(error);
            }
          );
        }
      );
    });
  },

  // Get requests by client ID
  getClientRequests: (clientId) => {
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            `SELECT r.*, (SELECT COUNT(*) FROM responses WHERE request_id = r.id) as response_count
             FROM requests r 
             WHERE r.client_id = ? 
             ORDER BY r.created_at DESC`,
            [clientId],
            (_, { rows }) => {
              const requests = [];
              for (let i = 0; i < rows.length; i++) {
                requests.push(rows.item(i));
              }
              resolve(requests);
            },
            (_, error) => {
              reject(error);
            }
          );
        }
      );
    });
  },

  // Get open requests with filters (for lawyers to find work)
  getOpenRequests: (filters = {}) => {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT r.*, u.username as client_name 
        FROM requests r
        JOIN users u ON r.client_id = u.id
        WHERE r.status = 'open'
      `;
      
      const queryParams = [];
      
      if (filters.law_area) {
        query += ` AND r.law_area = ?`;
        queryParams.push(filters.law_area);
      }
      
      if (filters.price_range) {
        query += ` AND r.price_range = ?`;
        queryParams.push(filters.price_range);
      }
      
      if (filters.maxExperienceRequired) {
        query += ` AND (r.experience_required IS NULL OR r.experience_required <= ?)`;
        queryParams.push(filters.maxExperienceRequired);
      }
      
      query += ` ORDER BY r.created_at DESC`;
      
      db.transaction(
        (tx) => {
          tx.executeSql(
            query,
            queryParams,
            (_, { rows }) => {
              const requests = [];
              for (let i = 0; i < rows.length; i++) {
                requests.push(rows.item(i));
              }
              resolve(requests);
            },
            (_, error) => {
              reject(error);
            }
          );
        }
      );
    });
  },

  // Get request details by ID (with responses)
  getRequestById: (requestId, userId, userType) => {
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          // Get request details
          tx.executeSql(
            `SELECT r.*, u.username as client_name, u.email as client_email, u.phone as client_phone
             FROM requests r
             JOIN users u ON r.client_id = u.id
             WHERE r.id = ?`,
            [requestId],
            (_, { rows }) => {
              if (rows.length === 0) {
                reject('Request not found');
                return;
              }
              
              const request = rows.item(0);
              
              // Get responses based on user type
              let query;
              let params;
              
              if (userType === 'client' && request.client_id === userId) {
                // Client can see all responses to their request
                query = `
                  SELECT resp.*, u.username as lawyer_name, l.specialization, l.experience, l.rating
                  FROM responses resp
                  JOIN lawyers l ON resp.lawyer_id = l.id
                  JOIN users u ON l.user_id = u.id
                  WHERE resp.request_id = ?
                  ORDER BY resp.created_at DESC
                `;
                params = [requestId];
              } else if (userType === 'lawyer') {
                // Lawyer can see only their own response
                query = `
                  SELECT resp.*, u.username as lawyer_name, l.specialization, l.experience, l.rating
                  FROM responses resp
                  JOIN lawyers l ON resp.lawyer_id = l.id
                  JOIN users u ON l.user_id = u.id
                  WHERE resp.request_id = ? AND l.user_id = ?
                  ORDER BY resp.created_at DESC
                `;
                params = [requestId, userId];
              } else {
                // Return request without responses for non-authorized users
                resolve(request);
                return;
              }
              
              tx.executeSql(
                query,
                params,
                (_, { rows: responseRows }) => {
                  const responses = [];
                  for (let i = 0; i < responseRows.length; i++) {
                    responses.push(responseRows.item(i));
                  }
                  
                  // Return request with responses
                  resolve({
                    ...request,
                    responses
                  });
                },
                (_, error) => {
                  reject(error);
                }
              );
            },
            (_, error) => {
              reject(error);
            }
          );
        }
      );
    });
  },
  
  // Submit a response to a request (lawyer)
  submitResponse: (requestId, lawyerId, message) => {
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          // Check if lawyer already responded
          tx.executeSql(
            'SELECT * FROM responses WHERE request_id = ? AND lawyer_id = ?',
            [requestId, lawyerId],
            (_, { rows }) => {
              if (rows.length > 0) {
                reject('You have already responded to this request');
                return;
              }
              
              // Insert response
              tx.executeSql(
                `INSERT INTO responses (request_id, lawyer_id, message)
                 VALUES (?, ?, ?)`,
                [requestId, lawyerId, message],
                (_, { insertId }) => {
                  // Add to history
                  tx.executeSql(
                    `INSERT INTO history 
                     (client_id, lawyer_id, request_id, interaction_type, details)
                     SELECT r.client_id, ?, r.id, 'response', 'Lawyer responded to request'
                     FROM requests r
                     WHERE r.id = ?`,
                    [lawyerId, requestId],
                    () => {
                      resolve(insertId);
                    },
                    (_, error) => {
                      reject(error);
                    }
                  );
                },
                (_, error) => {
                  reject(error);
                }
              );
            },
            (_, error) => {
              reject(error);
            }
          );
        }
      );
    });
  },
  
  // Update response status (accept/reject by client)
  updateResponseStatus: (responseId, status) => {
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            `UPDATE responses SET status = ? WHERE id = ?`,
            [status, responseId],
            (_, { rowsAffected }) => {
              if (rowsAffected > 0) {
                // Add to history and update request status if accepted
                if (status === 'accepted') {
                  tx.executeSql(
                    `UPDATE requests r
                     SET r.status = 'in_progress'
                     WHERE r.id = (SELECT request_id FROM responses WHERE id = ?)`,
                    [responseId],
                    () => {
                      tx.executeSql(
                        `INSERT INTO history 
                         (client_id, lawyer_id, request_id, interaction_type, details)
                         SELECT r.client_id, resp.lawyer_id, r.id, 'accepted', 'Client accepted lawyer response'
                         FROM responses resp
                         JOIN requests r ON resp.request_id = r.id
                         WHERE resp.id = ?`,
                        [responseId],
                        () => {
                          resolve('Response updated successfully');
                        },
                        (_, error) => {
                          reject(error);
                        }
                      );
                    },
                    (_, error) => {
                      reject(error);
                    }
                  );
                } else {
                  resolve('Response updated successfully');
                }
              } else {
                reject('Failed to update response');
              }
            },
            (_, error) => {
              reject(error);
            }
          );
        }
      );
    });
  }
}; 