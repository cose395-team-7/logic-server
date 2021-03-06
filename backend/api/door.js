// api/door.js

var express = require('express');
var router = express.Router();
var otpAPI = require('./otp.js');
var alcAPI = require('./alcohol.js');

var MIN_THRESHOLD = 70;
var MAX_THRESHOLD = 180;
var TIME_THRESHOLD = 180;

var networkAddress = "192.168.43";
var localAddress = "::1";

/*
 * isDoorOpen : variable that represents the door state. true - open, false - close
 */
var isDoorOpen = false;

/*
 * attemptCnt : variable that repersents the number of user's attempt to open the door
 */
var attemptCnt = 0;

router.getDoorState = function getDoorstate() {
  return doorStateToStr(isDoorOpen);
}

/*
 * doorStateToStr : change doorstate(boolean) to string format
 * return : "open" when isDoorOpen is true, "close" when isDoorOpen is false
 */
function doorStateToStr(isDoorOpen) {
  if(isDoorOpen)return "open";
  else return "none";
}

function OTPCheck(_otp) {
  if(otpAPI.getotp() === _otp){
    return true;
  }
  else return false;
}

/*
 * 안 분 경우 : getAlcMin > MIN_THRESHOLD       ----> return 1;
 * 수치가 높은 경우 : getAlcMax > MAX_THRESHOLD  ----> return 2;
 * 통과한 경우 :                                 ----> return 3;
 */
function ALCheck() {
  if(alcAPI.getalcMin() > MIN_THRESHOLD){
    return 1;
  }
  if(alcAPI.getalcMax() > MAX_THRESHOLD){
    return 2;
  }
  return 3;
}

function TimeCheck() {
  var old = alcAPI.getTimeForAlc();
  var now = new Date();
  var sec_gap = (now.getTime() - old.getTime())/1000;
  if(sec_gap > TIME_THRESHOLD){
    return false;
  }
  else {
    return true;
  }
}

function ResetProcess() {
  otpAPI.setotp("");
  attcmptCnt=0;
  alcAPI.resetAl();
}

/*
 * GET method
 * return the current status of door, "open" or "close"
 */
router.get('/', function(req, res, next) {

  // send the door state with string format
//  res.render('index', { title: 'IoT TermProject', door:doorStateToStr(isDoorOpen)});

  if(isDoorOpen) {
    isDoorOpen = false;
    ResetProcess();
    res.send(doorStateToStr(true));
  }
  else{
    res.send(doorStateToStr(isDoorOpen));
  }
});

/*
 * POST method : OTP attempt
 */
router.post('/', function(req,res) {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
  if((ip.indexOf(networkAddress) > -1) || (ip.indexOf(localAddress) > -1)){
    var otpInput = req.body.pwd;
    var alcResult = ALCheck();
    if(alcResult==3){
      if(TimeCheck()){
        if(OTPCheck(otpInput)){
          console.log("Door Open Set");
          isDoorOpen = true;
          res.send("PASS!! Wait Until the door open!");
        }
        else{
          attemptCnt+=1;
          if(attemptCnt >= 5){
            ResetProcess();
          }
          console.log("Wrong OTP");
          res.send("Wrong Password!!! You can't enter the room!!!" + "tried : " + attemptCnt);
        }
      }
      else{
        console.log("Time Expired");
        ResetProcess();
        res.send("Time Expired!!! You can't enter the room!!!");
      }
    }
    else if(alcResult==2){
      console.log("alcohol check Failed : type 2 - high value");
      res.send("Drunken!!!! You can't enter the room!!!");
    }
    else {
      console.log("alcohol check Failed: type 1 - did not blow");
      res.send("PLEASE BLOW THE ALCOHOL CHECKER!!!");
    }
  }
  else{
    console.log("Authentication Failed");
    res.send("Authentication Failed!!! You should be in the same network with Server!!!");
  }
//  res.render('index', { title: 'IoT TermProject', otp:otpAPI.getotp(), userOTP:otpInput});
//  res.send("user input : " + otpInput + ", answer otp : " + otpAPI.getotp());

/*
  if(OTPCheck(otpInput) && ALCheck()){
    console.log("isDoorOpen to true");
    isDoorOpen=true;
//    res.send("true");
  }
  else {
    attemptCnt+=1;
    if(attemptCnt >= 5){
      otpAPI.setotp("");
      attcmptCnt=0;
//      res.send("false");
    }
    console.log("OTP is wrong");
//    res.send("false");
  }
  */
});

module.exports = router;
