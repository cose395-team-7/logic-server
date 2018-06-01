// api/otp.js

var express = require('express');
var router = express.Router();

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

/* GET home page. */
router.get('/', function(req, res, next) {

  /*
   * random number generation with length 4 which is used as OTP
   * created otp is stored in optStr in string type
   */
  var otpNum = new Array();
  var otpStr = "";
  for (var i=0;i<4;i++){
    otpNum[i]=getRandomInt(10);
    otpStr+=otpNum[i];
  }

  /*
   * return success and data with json format
   * success : bool
   * data : string
   */
  res.write(otpStr);
});

module.exports = router;