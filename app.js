//var helmet = require('helmet');
const createError = require('http-errors');
const express = require('express');
const path = require('path');
// const favicon = require('serve-favicon');
const logger = require('morgan');
// const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');

const passport = require('passport');


const queryParser = require('express-query-int');

const http = require('http');


const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//app.use(helmet());
//helmet.js를 사용하는 경우에는 사용자를 대신하여 helmet.js가 위의 작업을 실행합니다.
//app.disable('x-powered-by');

app.use(logger('dev'));
app.use(queryParser()); // ?a=1&b[c]=2 => => { a: 4, b: { c: 2 } } 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/static', express.static(path.join(__dirname, 'public')));


// CORS 설정
app.use(cors());

app.use(passport.initialize());


//router setting
app.use('/', require('./api/index'))
app.use('/v1/boards', require('./api/v1/boards/'))
app.use('/v1/footballchats', require('./api/v1/footballchats/'))
app.use('/v1/best', require('./api/v1/best/'))
app.use('/v1/bests', require('./api/v1/bests/')) //remove next version
app.use('/v1/users', require('./api/v1/users/'))
app.use('/v1/comments', require('./api/v1/comments/'))
app.use('/v1/contents', require('./api/v1/contents/'))
app.use('/v1/settings', require('./api/v1/settings/'))
app.use('/v1/auth', require('./api/v1/auth/'))
app.use('/v1/issue', require('./api/v1/issue/'))
app.use('/v1/poll', require('./api/v1/poll/'))
app.use('/v1/tags', require('./api/v1/tags/'))
app.use('/v1/report', require('./api/v1/report/'))
app.use('/v1/notification', require('./api/v1/notification/'))
app.use('/v1/matchtalk', require('./api/v1/matchtalk/'))


//swagger api documnt 
// 도큐먼트 수정은  /public/swagger.json 

app.use('/swagger', express.static(path.join(__dirname, './node_modules/swagger-ui-dist')));
app.use('/doc', function (req, res) {
  res.redirect('/swagger?url=/swagger.json');
});



// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json( {
      result : 0,
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json( {
    result : 0,
    message: err.message,
    error: err
  });
});





http.createServer(app).listen(5300, function(){
  console.log('Hifive API server listening on port ' + 5300);
});


module.exports = app;
