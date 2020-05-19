const signInButton = document.getElementById('sign-in-button');
const signInPhoneNumber = document.getElementById('sign-in-phone-number');
const signInConformationCode = document.getElementById('sign-in-conformation-code');
const signInVerifyCodeButton = document.getElementById('sign-in-verify');

const auth = firebase.auth();
var user;

window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('sign-in-button', {
    'size': 'invisible',
    'callback': function(response) {
    }
});


const sendVerificationCode = () =>{
  const phoneNumber = signInPhoneNumber.value;
  const appVerifier = window.recaptchaVerifier;

  auth.signInWithPhoneNumber(phoneNumber,appVerifier).then(confirmationResult => {
    const sentCodeId = confirmationResult.verificationId;
    displayChat();
    signInVerifyCodeButton.addEventListener('click', () => signInWithPhone(sentCodeId));
  })
};


const signInWithPhone = sentCodeId =>{
  const code = signInConformationCode.value;
  const credential = firebase.auth.PhoneAuthProvider.credential(sentCodeId,code);
  auth.signInWithCredential(credential).then(() =>{
    user = auth.currentUser;
    if(user != null){
        window.location.assign('./pigeotalkweb.html');
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
  document.getElementById('login-panel').setAttribute('style','display:none');
}

