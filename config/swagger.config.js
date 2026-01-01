const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Gestion des Émargements',
      version: '1.0.0',
      description: 'Documentation de l\'API pour la gestion des émargements d\'examens',
      contact: {
        name: 'Support API',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur de développement'
      },
      {
        url: 'https://api.production.com',
        description: 'Serveur de production'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Entrez votre token JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID de l\'utilisateur'
            },
            nom: {
              type: 'string',
              description: 'Nom de famille'
            },
            prenom: {
              type: 'string',
              description: 'Prénom'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email'
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'SURVEILLANT', 'ETUDIANT'],
              description: 'Rôle de l\'utilisateur'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Message d\'erreur'
            },
            error: {
              type: 'string',
              description: 'Détails de l\'erreur (uniquement en développement)'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token d\'authentification manquant ou invalide',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                message: 'Non autorisé'
              }
            }
          }
        },
        ValidationError: {
          description: 'Erreur de validation des données',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js'] // Chemins vers vos fichiers à documenter
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;