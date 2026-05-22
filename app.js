require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var helmet = require('helmet');
var swaggerUi = require('swagger-ui-express');
var swaggerSpec = require('./config/swagger');

// Import routes
var taskRoutes = require('./routes/taskRoutes');
var applicationRoutes = require('./routes/applicationRoutes');
var matchingRoutes = require('./routes/matchingRoutes');

var app = express();

// Security & CORS
app.use(helmet());
app.use(cors());

// Request parsing
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// SWAGGER UI
// ==========================================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SnapOn API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
  },
}));

// Root → redirect to Swagger
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// ==========================================
// ROUTES
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SnapOn API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes — Flow A: Posting → Bidding → Matching
app.use('/api/tasks', taskRoutes);
app.use('/api', applicationRoutes);
app.use('/api', matchingRoutes);

// ==========================================
// ERROR HANDLING
// ==========================================

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler — returns JSON for API requests
app.use(function(err, req, res, next) {
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Log error in development
  if (req.app.get('env') === 'development') {
    console.error('Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(req.app.get('env') === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
