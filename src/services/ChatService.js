import { db } from '../database/database';

const ChatService = {
  // Получить все беседы пользователя
  getConversations: async (userId) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT user_type FROM users WHERE id = ?`,
          [userId],
          (_, { rows }) => {
            if (rows.length === 0) {
              reject('User not found');
              return;
            }
            
            const user = rows.item(0);
            let query, params;
            
            if (user.user_type === 'client') {
              // For client - get conversations where they are the client
              query = `
                SELECT c.*, 
                  u.username as lawyer_name,
                  m.message as last_message,
                  m.created_at as last_message_time
                FROM chat_conversations c
                JOIN users u ON c.lawyer_id = u.id
                LEFT JOIN chat_messages m ON c.last_message_id = m.id
                WHERE c.client_id = ?
                ORDER BY c.updated_at DESC
              `;
              params = [userId];
            } else {
              // For lawyer - get conversations where they are the lawyer
              query = `
                SELECT c.*, 
                  u.username as client_name,
                  m.message as last_message,
                  m.created_at as last_message_time
                FROM chat_conversations c
                JOIN users u ON c.client_id = u.id
                LEFT JOIN chat_messages m ON c.last_message_id = m.id
                WHERE c.lawyer_id = ?
                ORDER BY c.updated_at DESC
              `;
              params = [userId];
            }
            
            tx.executeSql(
              query,
              params,
              (_, { rows: conversationRows }) => {
                const conversations = [];
                for (let i = 0; i < conversationRows.length; i++) {
                  conversations.push(conversationRows.item(i));
                }
                resolve(conversations);
              },
              (_, error) => {
                console.error('Error getting conversations:', error);
                reject(error);
              }
            );
          },
          (_, error) => {
            console.error('Error getting user type:', error);
            reject(error);
          }
        );
      });
    });
  },
  
  // Get conversations for a client
  getConversationsByClientId: (clientId) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT c.*, 
            u.username as lawyer_name,
            m.message as last_message,
            m.created_at as last_message_time
           FROM chat_conversations c
           JOIN users u ON c.lawyer_id = u.id
           LEFT JOIN chat_messages m ON c.last_message_id = m.id
           WHERE c.client_id = ?
           ORDER BY c.updated_at DESC`,
          [clientId],
          (_, { rows }) => {
            const conversations = [];
            for (let i = 0; i < rows.length; i++) {
              conversations.push(rows.item(i));
            }
            resolve(conversations);
          },
          (_, error) => {
            console.error('Error getting conversations:', error);
            reject(error);
          }
        );
      });
    });
  },

  // Get conversations for a lawyer
  getConversationsByLawyerId: (lawyerId) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT c.*, 
            u.username as client_name,
            m.message as last_message,
            m.created_at as last_message_time
           FROM chat_conversations c
           JOIN users u ON c.client_id = u.id
           LEFT JOIN chat_messages m ON c.last_message_id = m.id
           WHERE c.lawyer_id = ?
           ORDER BY c.updated_at DESC`,
          [lawyerId],
          (_, { rows }) => {
            const conversations = [];
            for (let i = 0; i < rows.length; i++) {
              conversations.push(rows.item(i));
            }
            resolve(conversations);
          },
          (_, error) => {
            console.error('Error getting conversations:', error);
            reject(error);
          }
        );
      });
    });
  },
  
  // Получить сообщения для конкретного разговора
  getMessages: async (conversationId) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT client_id, lawyer_id, request_id FROM chat_conversations
           WHERE id = ?`,
          [conversationId],
          (_, { rows }) => {
            if (rows.length === 0) {
              reject('Conversation not found');
              return;
            }
            
            const conversation = rows.item(0);
            
            tx.executeSql(
              `SELECT 
                m.id, m.sender_id, m.message, m.read, m.created_at,
                u.username as sender_name,
                u.user_type as sender_type
              FROM chat_messages m
              JOIN users u ON m.sender_id = u.id
              WHERE (m.sender_id = ? AND m.receiver_id = ?) OR 
                    (m.sender_id = ? AND m.receiver_id = ?)
              ORDER BY m.created_at ASC`,
              [conversation.client_id, conversation.lawyer_id, 
               conversation.lawyer_id, conversation.client_id],
              (_, { rows: messageRows }) => {
                const messages = [];
                for (let i = 0; i < messageRows.length; i++) {
                  messages.push(messageRows.item(i));
                }
                
                resolve({ conversation, messages });
              },
              (_, error) => {
                console.error('Error getting messages:', error);
                reject(error);
              }
            );
          },
          (_, error) => {
            console.error('Error getting conversation:', error);
            reject(error);
          }
        );
      });
    });
  },

  // Get messages for a conversation
  getMessagesByConversationId: (conversationId) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        // First get the conversation details to get client_id and lawyer_id
        tx.executeSql(
          `SELECT client_id, lawyer_id FROM chat_conversations WHERE id = ?`,
          [conversationId],
          (_, { rows }) => {
            if (rows.length === 0) {
              reject('Conversation not found');
              return;
            }
            
            const conversation = rows.item(0);
            
            // Now get all messages for this conversation
            tx.executeSql(
              `SELECT m.*, 
                CASE 
                  WHEN m.sender_id = ? THEN 'client'
                  WHEN m.sender_id = ? THEN 'lawyer'
                  ELSE 'unknown'
                END as sender_type
               FROM chat_messages m
               WHERE (m.sender_id = ? AND m.receiver_id = ?) OR
                     (m.sender_id = ? AND m.receiver_id = ?)
               ORDER BY m.created_at ASC`,
              [
                conversation.client_id, conversation.lawyer_id,
                conversation.client_id, conversation.lawyer_id,
                conversation.lawyer_id, conversation.client_id
              ],
              (_, { rows: messageRows }) => {
                const messages = [];
                for (let i = 0; i < messageRows.length; i++) {
                  messages.push(messageRows.item(i));
                }
                resolve(messages);
              },
              (_, error) => {
                console.error('Error getting messages:', error);
                reject(error);
              }
            );
          },
          (_, error) => {
            console.error('Error getting conversation:', error);
            reject(error);
          }
        );
      });
    });
  },
  
  // Отправка нового сообщения
  sendMessage: (senderId, receiverId, message, requestId = null) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        // Insert the message first
        tx.executeSql(
          `INSERT INTO chat_messages 
           (sender_id, receiver_id, request_id, message, read, created_at)
           VALUES (?, ?, ?, ?, 0, datetime('now'))`,
          [senderId, receiverId, requestId, message],
          (_, { insertId: messageId }) => {
            // Now determine user types to set up the conversation correctly
            tx.executeSql(
              `SELECT id, user_type FROM users WHERE id IN (?, ?)`,
              [senderId, receiverId],
              (_, { rows: userRows }) => {
                if (userRows.length < 2) {
                  reject('One or more users not found');
                  return;
                }
                
                const senderType = userRows.item(0).id === senderId ? 
                  userRows.item(0).user_type : userRows.item(1).user_type;
                const receiverType = userRows.item(0).id === receiverId ? 
                  userRows.item(0).user_type : userRows.item(1).user_type;
                
                let clientId, lawyerId;
                if (senderType === 'client') {
                  clientId = senderId;
                  lawyerId = receiverId;
                } else {
                  clientId = receiverId;
                  lawyerId = senderId;
                }
                
                // Check if conversation already exists
                tx.executeSql(
                  `SELECT id FROM chat_conversations
                   WHERE client_id = ? AND lawyer_id = ?`,
                  [clientId, lawyerId],
                  (_, { rows: convRows }) => {
                    if (convRows.length > 0) {
                      // Update existing conversation
                      const conversationId = convRows.item(0).id;
                      tx.executeSql(
                        `UPDATE chat_conversations
                         SET last_message_id = ?,
                             unread_count = unread_count + 1,
                             updated_at = datetime('now')
                         WHERE id = ?`,
                        [messageId, conversationId],
                        () => {
                          resolve({ messageId, conversationId });
                        },
                        (_, error) => {
                          console.error('Error updating conversation:', error);
                          reject(error);
                        }
                      );
                    } else {
                      // Create new conversation
                      tx.executeSql(
                        `INSERT INTO chat_conversations
                         (client_id, lawyer_id, request_id, last_message_id, unread_count, created_at, updated_at)
                         VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
                        [clientId, lawyerId, requestId, messageId],
                        (_, { insertId: conversationId }) => {
                          resolve({ messageId, conversationId });
                        },
                        (_, error) => {
                          console.error('Error creating conversation:', error);
                          reject(error);
                        }
                      );
                    }
                  },
                  (_, error) => {
                    console.error('Error checking for existing conversation:', error);
                    reject(error);
                  }
                );
              },
              (_, error) => {
                console.error('Error getting user types:', error);
                reject(error);
              }
            );
          },
          (_, error) => {
            console.error('Error inserting message:', error);
            reject(error);
          }
        );
      });
    });
  },
  
  // Create a new conversation between client and lawyer
  createConversation: (clientId, lawyerId, requestId = null) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        // Check if conversation already exists
        tx.executeSql(
          `SELECT id FROM chat_conversations 
           WHERE client_id = ? AND lawyer_id = ?`,
          [clientId, lawyerId],
          (_, { rows }) => {
            if (rows.length > 0) {
              // Conversation already exists, return its ID
              resolve(rows.item(0).id);
            } else {
              // Create new conversation
              tx.executeSql(
                `INSERT INTO chat_conversations 
                 (client_id, lawyer_id, request_id, unread_count, created_at, updated_at)
                 VALUES (?, ?, ?, 0, datetime('now'), datetime('now'))`,
                [clientId, lawyerId, requestId],
                (_, { insertId }) => {
                  resolve(insertId);
                },
                (_, error) => {
                  console.error('Error creating conversation:', error);
                  reject(error);
                }
              );
            }
          },
          (_, error) => {
            console.error('Error checking existing conversation:', error);
            reject(error);
          }
        );
      });
    });
  },
  
  // Отметить сообщения как прочитанные
  markMessagesAsRead: (conversationId, userId) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT client_id, lawyer_id FROM chat_conversations
           WHERE id = ?`,
          [conversationId],
          (_, { rows }) => {
            if (rows.length === 0) {
              reject('Conversation not found');
              return;
            }
            
            const conversation = rows.item(0);
            const otherUserId = conversation.client_id === userId ? 
              conversation.lawyer_id : conversation.client_id;
            
            tx.executeSql(
              `UPDATE chat_messages
               SET read = 1
               WHERE sender_id = ? AND receiver_id = ? AND read = 0`,
              [otherUserId, userId],
              (_, { rowsAffected }) => {
                tx.executeSql(
                  `UPDATE chat_conversations
                   SET unread_count = 0
                   WHERE id = ?`,
                  [conversationId],
                  () => {
                    resolve(rowsAffected);
                  },
                  (_, error) => {
                    console.error('Error updating conversation unread count:', error);
                    reject(error);
                  }
                );
              },
              (_, error) => {
                console.error('Error marking messages as read:', error);
                reject(error);
              }
            );
          },
          (_, error) => {
            console.error('Error getting conversation:', error);
            reject(error);
          }
        );
      });
    });
  },
  
  // Создать беседу между клиентом и адвокатом (когда адвокат откликается на заявку)
  createConversationFromResponse: (responseId) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT resp.lawyer_id, req.client_id, resp.request_id, resp.message
           FROM responses resp
           JOIN requests req ON resp.request_id = req.id
           WHERE resp.id = ?`,
          [responseId],
          (_, { rows }) => {
            if (rows.length === 0) {
              reject('Response not found');
              return;
            }
            
            const response = rows.item(0);
            
            // Get lawyer's user_id
            tx.executeSql(
              `SELECT user_id FROM lawyers WHERE id = ?`,
              [response.lawyer_id],
              (_, { rows: lawyerRows }) => {
                if (lawyerRows.length === 0) {
                  reject('Lawyer not found');
                  return;
                }
                
                const lawyerUserId = lawyerRows.item(0).user_id;
                
                // Create first message from lawyer
                tx.executeSql(
                  `INSERT INTO chat_messages (sender_id, receiver_id, request_id, message, read, created_at)
                   VALUES (?, ?, ?, ?, 0, datetime('now'))`,
                  [lawyerUserId, response.client_id, response.request_id, response.message],
                  (_, { insertId: messageId }) => {
                    // Create conversation
                    tx.executeSql(
                      `INSERT INTO chat_conversations
                       (client_id, lawyer_id, request_id, last_message_id, unread_count, created_at, updated_at)
                       VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
                      [response.client_id, lawyerUserId, response.request_id, messageId],
                      (_, { insertId: conversationId }) => {
                        resolve(conversationId);
                      },
                      (_, error) => {
                        console.error('Error creating conversation:', error);
                        reject(error);
                      }
                    );
                  },
                  (_, error) => {
                    console.error('Error creating first message:', error);
                    reject(error);
                  }
                );
              },
              (_, error) => {
                console.error('Error getting lawyer user_id:', error);
                reject(error);
              }
            );
          },
          (_, error) => {
            console.error('Error getting response:', error);
            reject(error);
          }
        );
      });
    });
  },
  
  // Получить всех пользователей, с которыми можно начать беседу
  getPotentialChatPartners: (userId) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT user_type FROM users WHERE id = ?`,
          [userId],
          (_, { rows }) => {
            if (rows.length === 0) {
              reject('User not found');
              return;
            }
            
            const userType = rows.item(0).user_type;
            let query, params = [];
            
            if (userType === 'client') {
              // Clients can chat with lawyers
              query = `
                SELECT 
                  u.id, u.username, 
                  l.specialization, l.experience, l.rating, l.city
                FROM users u
                JOIN lawyers l ON u.id = l.user_id
                WHERE u.user_type = 'lawyer'
                ORDER BY l.rating DESC
              `;
            } else {
              // Lawyers can chat with clients who have open requests
              query = `
                SELECT DISTINCT
                  u.id, u.username,
                  (SELECT COUNT(*) FROM requests WHERE client_id = u.id) as request_count
                FROM users u
                JOIN requests r ON u.id = r.client_id
                WHERE u.user_type = 'client' AND r.status = 'open'
                ORDER BY request_count DESC
              `;
            }
            
            tx.executeSql(
              query,
              params,
              (_, { rows: partnerRows }) => {
                const partners = [];
                for (let i = 0; i < partnerRows.length; i++) {
                  partners.push(partnerRows.item(i));
                }
                resolve(partners);
              },
              (_, error) => {
                console.error('Error getting chat partners:', error);
                reject(error);
              }
            );
          },
          (_, error) => {
            console.error('Error getting user type:', error);
            reject(error);
          }
        );
      });
    });
  }
};

export default ChatService; 