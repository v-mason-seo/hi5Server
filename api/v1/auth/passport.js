const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const KakaoStrategy = require('passport-kakao').Strategy;
const NaverStrategy = require('passport-naver').Strategy;

const db = require('../../../services/mysqlservice');
const cmd = require('../../../config/commands');
const auth = require('../../../services/auth');
const bcrypt = require('bcrypt');

/////////
var async = require('async');

passport.serializeUser(function (user, done) {
    // console.log('serializeUser' , user);
    done(null, user.id);
});

// passport.deserializeUser(function(id, done) {
//     console.log('deserializeUser' , id);
//     var user = {id : 'mandu', name : "youngchill"};
//     done(null, user);
// });


exports.setup = function () {
    // passport - local
    passport.use('local', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password'
        },
        function (username, password, done) {


            let query = `select user_id as userid, pw  from user_login where email = ?;`

            const parameter = [username];

            db.excuteSql(query, parameter, (err, result) => {
                if (err) {
                    return done(err, null);
                }
                //success
                if (result.length === 0) {
                    return done(null, false, '회원이 없습니다');
                }

                bcrypt.compare(password, result[0].pw, function (err, cryptResult) {
                    if (cryptResult) {
                        // Passwords match
                        let user = {}
                        user.userid = result[0].userid
                        return done(null, user);
                    } else {
                        // Passwords don't match
                        //  console.log("not matched password" )
                        let user = result[0];
                        return done(null, false, '이메일주소 또는 비밀번호를 다시 확인하세요');
                    }
                });
            });
        }
    ));

    passport.use('local-social', new LocalStrategy({
            usernameField: 'provider',
            passwordField: 'provider_user_id',
        },
        function (provider, provider_user_id, done) {
            // var request = require('request');

            let query = `select user_id as userid from user_login where provider = ? and provider_user_id = ? and deleted = 0;`

            const parameter = [provider, provider_user_id];

            db.excuteSql(query, parameter, (err, result) => {
                if (err) {
                    return done(err, null)
                }
                //success
                if (result.length === 0) {
                    return done(null, false, '회원이 없습니다');
                }
                let user = result[0];
                return done(null, user);
            })


        }
    ));

    passport.use('local-social-signup', new LocalStrategy({
            usernameField: 'provider',
            passwordField: 'provider_user_id',
            passReqToCallback: true
        },
        function (req, provider, provider_user_id, done) {

            const user = {};
            user.username = req.body.username
            user.nickname = req.body.nickname
            user.email = req.body.email
            user.avatarURL = req.body.avatar_url
            user.provider = req.body.provider
            user.pw = req.body.password
            user.profile = (req.body.profile ? req.body.profile : undefined);
            //if pw come-in should

            var hash = bcrypt.hashSync(req.body.password, 10);
            user.pw = hash

            user.providerUserID = req.body.provider_user_id



            //숫자 더해서 비교 

            db.excuteSocialUserGetID(user, (err, result) => {
                if (err) {
                    return done(err, null);
                }

                if (result.command === cmd.notExistMember) {
                    db.excuteSocialUserSingUp(result.user, (err, result) => {
                        if (err) {
                            return done(err, null);
                        }
                        user.userid = result.data
                        return done(null, user);
                    });
                } else if (result.result === 1) {
                    user.userid = result.data.userid
                    return done(null, user);
                }
            })
        }
    ));


    // passport - kakao


    passport.use(new KakaoStrategy({
            clientID: '771485312f806a93357ea94a7a97af4e',
            callbackURL: '/V1/auth/login/kakao/callback'
        },
        function (accessToken, refreshToken, profile, done) {
            // 사용자의 정보는 profile에 들어있다.
            // console.log(profile);
            // done(null, profile);

            let provider = profile.provider;
            let provider_user_id = profile.id;
            // let email = JSON.parse( profile._raw).kaccount_email;
            // let username = profile.username;

            let query = `
                    select user_id 
                    from user_login 
                    where provider = ? and provider_user_id = ? and deleted = 0;
                    `

            const parameter = [provider, provider_user_id];

            db.excuteSql(query, parameter, (err, result) => {
                if (err) {
                    return done(err, null);
                }
                //success
                if (result.length === 0) {
                    return done(null, false, '회원이 없습니다');
                }
                let user = result[0];
                return done(null, user);
            });
        }
    ));

    passport.use(new NaverStrategy({
            clientID: 'TCRaOokXiNEWDa5jTU6J',
            clientSecret: 'O95KT4fPoH',
            callbackURL: '/V1/auth/login/naver/callback'
        },
        function (accessToken, refreshToken, profile, done) {

            var parseString = require('xml2js').parseString;
            var xml = profile._raw;
            var user = {};
            user.email = profile.email;
            user.name = profile.displayName;

            parseString(xml, function (err, result) {
                if (err) {
                    return done(err, null)
                }

                user.provider = profile.provider;
                user.providerUserID = result.data.response[0].id[0];
                user.avatarURL = result.data.response[0].profile_image[0];
                user.password = result.data.response[0].nickname[0];

                db.excuteSocialUserGetID(user, (err, result) => {
                    if (err) {
                        return done(err, null);
                    }

                    if (result.command === cmd.notExistMember) {
                        db.excuteSocialUserSingUp(result.user, (err, result) => {
                            if (err) {
                                return done(err, null);
                            }
                            return done(null, result.data);
                        });
                    }
                    return done(null, result.data);
                })
            });
        }
    ));


    // passport - jwt
    var opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    opts.secretOrKey = auth.config.REFRESH_SECRET;

    passport.use(new JwtStrategy(opts, function (jwt_payload, done) {

        var userid = jwt_payload.userid;
        let audience = jwt_payload.audience;
        let username = jwt_payload.username; //fake ramdome

        if (audience !== "hifivefootball.com") {
            done("Bad Audience", null)
        }

        async.waterfall([
            async.constant(jwt_payload),
                function (jwt_payload, callback) {
                    let query = 'select refresh_token from user_login where user_id = ? and deleted = 0';
                    var parameter = [userid];
                    //if ok 
                    db.excuteSql(query, parameter, function (err, result) {
                        if (err) {
                            return callback(err, null)
                        }
                        //check jwt is valide
                        if (result === undefined || result.length == 0) callback('회원 데이터가 없습니다', null)

                        let token = result[0].refresh_token;

                        if (!token) {
                            return callback(err, null)
                        }

                        return callback(null, jwt_payload, token)
                    })
                },
                function (jwt_payload, token, callback) {
                    var decodedToken = auth.verifyRefreshToken(token)

                    if (decodedToken.username == jwt_payload.username) {
                        return callback(null, jwt_payload.userid)
                    }
                    return done({
                        message: 'invalide refreshToken, Login Again'
                    }, null)
                }
        ], function (err, userid) {
            if (err) {
                return done(err, null)
            }
            var user = {}
            user.userid = userid
            return done(null, user)
        });


    }));
}