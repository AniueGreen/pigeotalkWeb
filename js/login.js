const signInButton = document.getElementById('sign-in-button');
const signInPhoneNumber = document.getElementById('Phone');
const signInConformationCode = document.getElementById('sign-in-conformation-code');
const signInVerifyCodeButton = document.getElementById('sign-in-verify');

const auth = firebase.auth();
var user;

var list = libphonenumber.getCountries()
console.log(list);

for (i = 0; i < list.length; i++) {
  var opt =  `<option id="${list[i]}"> ${list[i]}</option>`;
  document.getElementById("country-select").innerHTML += opt;
}

var CountryCode;
var countryName;
$(document).on("click","#country-select", function() {
  let clickedOption = $(this).val();
  countryName=clickedOption;
  getCode(libphonenumber.getCountryCallingCode(clickedOption));
 });


function getCode(code){
  console.log(code);
  CountryCode = code;
  document.getElementById("CountryCode").value = "+"+code;
}

window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('sign-in-button', {
  'size': 'invisible',
  'callback': function(response) {
    console.log(response)    
  }
});

const sendVerificationCode = () =>{
  const appVerifier = window.recaptchaVerifier;
  const phoneNum = "+"+CountryCode+signInPhoneNumber.value;

  const phoneNumber = libphonenumber.parsePhoneNumberFromString(phoneNum, countryName)
  if (phoneNumber.isValid() === true) {
        auth.signInWithPhoneNumber(phoneNum,appVerifier).then(confirmationResult => {
          console.log("conformationResult" + confirmationResult);

          const sentCodeId = confirmationResult.verificationId;
          displayChat();
          signInVerifyCodeButton.addEventListener('click', () => signInWithPhone(sentCodeId));
      });
  }
  else{
    alert("This number is not valid");
  }
};


const signInWithPhone = sentCodeId =>{
  flag = false;
  const code = signInConformationCode.value;
  const credential = firebase.auth.PhoneAuthProvider.credential(sentCodeId,code);
  auth.signInWithCredential(credential).then(() =>{
    user = auth.currentUser;
    if(user != null){
       firebase.database().ref('user_phone_numbers').once('value', function(snapshot){
         snapshot.forEach(function(val){
          console.log(auth.currentUser.phoneNumber);
          console.log("val:"+val.key)
          if(val.key === auth.currentUser.phoneNumber){
            window.location.assign('./index.html');
            flag = true;
            return;
          }
         })
         if(flag !== true){
          auth.currentUser.delete().then(function(){
            alert("This is not a registered number. You can register by downloading the app from pigeotalk.com/dl");
            window.location.assign('./loginpage.html');
            });
         }
       });
    }else{
        alert("User is null");
    }
  }).catch(error => {
    console.error(error);
  })
}

signInButton.addEventListener('click',sendVerificationCode);

function displayChat(){
  document.getElementById('verification-panel').removeAttribute('style');
  document.getElementById('loginPanel').setAttribute('style','display:none');
}



