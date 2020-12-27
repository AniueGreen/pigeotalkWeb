const auth = firebase.auth();
function onFirebaseStateChange(){
    firebase.auth().onAuthStateChanged(onStateChanged);
}
onFirebaseStateChange();

function onStateChanged(currentUser){
    console.log("Current User : " + currentUser.uid);
    if(currentUser !== null){
        var userId = currentUser.uid;
        firebase.database().ref('users').child(userId).child('presence').update({isOnline : "true"});
        firebase.database().ref('users').child(userId).on('value',function(snapshot){
            user = snapshot.val();
            getUserInformation();
            getAllChats();
        })
    }else{
        /*window.location.assign('./loginpage.html');*/
    }
}

///////////////////////////////////////////////////////////////////////
//GET ALL CHATS
function getAllChats(){
    firebase.database().ref('user_chats').child(user.uid).on('value',function (snapshot){
        snapshot.forEach(function(val){
            var chatId = val.key;
            var contactId = val.node_.value_;
            console.log(val);
            if(document.getElementById("chatId-"+contactId) === null){
                var chat = `<div id="${"chatId-"+contactId}" class="chat-list chat-list--onhover">
                                <img id="${"chatContactPicture-"+contactId}" alt="Chat Contact Photo" class="profile-image"></img>
                                <div class="chat-list-text">
                                    <h6 id="${"chatContactName-"+contactId}"></h6>
                                    <p id="${"chatLastMessage-"+contactId}" class="text-muted chat-last-message"></p>
                                </div>
                                <span id="${"chatLastMessageTime-"+contactId}" class="chat-list-time text-muted small">
                                </span>
                            </div>
                            <hr>`
                document.getElementById('chatList').innerHTML += chat;

                //Gets contact name
                firebase.database().ref('users').child(user.uid).child('contacts').child(contactId).on('value',function(snapshot){
                    var contactName = snapshot.val();
                    if(contactName === null || contactName === ""){
                        contactName = snapshot.val()
                    }
                    document.getElementById("chatContactName-"+contactId).innerHTML = contactName;

                    //Gets contact profile picture
                    //This is not neccessary THIS WILL BE REMOVE
                    firebase.database().ref('users').child(contactId).on('value',function(snapshot){
                        var contactPicture = snapshot.val().profile_photo_url;
                        document.getElementById("chatContactPicture-"+contactId).src=contactPicture;

                        //Gets last message id
                        firebase.database().ref('chats').child(chatId).child('last_message_id').on('value',function(snapshot){
                            var last_message_id = snapshot.val();

                            //Gets last message
                            firebase.database().ref('chat_messages').child(chatId).child(last_message_id).on('value',function(snapshot){
                                var isRead = snapshot.val().isRead;
                                var messageType = snapshot.val().messageType;
                                var lastMessage = snapshot.val().message;
                                var timestamp = moment.utc(parseInt(snapshot.val().timestamp));
                                var time = timestamp.local().format("HH:mm");
                                document.getElementById("chatId-"+contactId).onclick = displayChat.bind(this,[contactName,contactPicture,chatId,contactId]);
                                document.getElementById("chatLastMessageTime-"+contactId).innerHTML = time;
                                if(messageType === "image"){
                                    document.getElementById("chatLastMessage-"+contactId).innerHTML = `<i class="material-icons">camera_alt</i>Photo`
                                }else if (messageType === "plaintext"){
                                    document.getElementById("chatLastMessage-"+contactId).innerHTML = lastMessage;
                                }

                                if(isRead === "false" && snapshot.val().sender !== user.uid){
                                    document.getElementById("chatLastMessage-"+contactId).style.fontWeight = "500";
                                }
                            })
                        })
                    })
                })
            }else{
                return;
            }
        })
    });

   /* firebase.database().ref('chat_messages').child(chatID).limitToLast(1).on('child_changed',function(snapshot){
        if(snapshot.val().isRead === "true"){
            document.getElementById("chatLastMessage-"+contactId).style.fontWeight = "0";
        }else if(snapshot.val().isRead ==="false"){
            document.getElementById("chatLastMessage-"+contactId).style.fontWeight = "500";
        }
    });*/
}


///////////////////////////////////////////////////////////////////////
//GET ALL CONTACTS
var flag;
function getAllContacts(){
    firebase.database().ref('users').child(user.uid).child('contacts').on('value',function(snapshot){
        snapshot.forEach(function(val){
            var contactId = val.key;
            var contactName = val.node_.value_; 
            if(document.getElementById("contactId-"+contactId) === null){
                var contact = `<div id="${"contactId-"+contactId}" class="chat-list chat-list--onhover">
                                    <img id="${"contactPicture-"+contactId}" alt="Chat Contact Photo" class="profile-image"></img>
                                    <div class="chat-list-text">
                                        <h6 id="${"contactName-"+contactId}"></h6>
                                        <p id="${"contactAbout-"+contactId}" class="text-muted"></p>
                                    </div>
                                </div>
                                <hr>`
                document.getElementById('contactList').innerHTML += contact;

                firebase.database().ref('users').child(contactId).on('value',function(snapshot){
                    var contactPhoto = snapshot.val().profile_photo_url;
                    var contactAbout = snapshot.val().about;
                    flag = false;
                    document.getElementById("contactPicture-"+contactId).src = contactPhoto;
                    document.getElementById("contactAbout-"+contactId).innerHTML = contactAbout;
                    document.getElementById("contactName-"+contactId).innerHTML = contactName;
                    document.getElementById("contactId-"+contactId).onclick = startChat.bind(this,[contactId,contactName,contactPhoto])
                })
            }else{
                return;
            }
        })
    })
}


////////////////////////////////////////////////////////////////////////
//GET ALL MESSAGES
var chat
function getAllMessages(contact){
    var contactName = contact[0];
    var contactPicture = contact[1];
    var chatID = contact[2];
    var contactId = contact[3];
    chat = contact;
    firebase.database().ref('users').child(contactId).child('presence').on('value',function(snapshot){
        if(snapshot.val().isOnline === "false"){
            var timestamp = moment.utc(parseInt(snapshot.val().last_seen));
            var time = timestamp.local().format("HH:mm");
            var now = moment(timestamp).fromNow()
            document.getElementById("contactPresence").innerHTML = now;
        }else{
            document.getElementById("contactPresence").innerHTML = "Online"
        }
    })

    document.getElementById("contactName").innerHTML = contactName
    document.getElementById("chat-tray-contact-picture").src = contactPicture
    document.getElementById('chatBody').innerHTML = ""

    if(chatID !== ""){
         displayChatlistener = firebase.database().ref('chat_messages').child(chatID).once('value', function(snapshot){
            var i = 1; 
            snapshot.forEach(function(val){
    
                if(i === snapshot.numChildren()){
                    getLastMessage(chatID);
                    return;
                }
    
                var timestamp = moment.utc(parseInt(val.val().timestamp));
                var time = timestamp.local().format("HH:mm");
                if(val.val().sender === user.uid){
                    if(val.val().messageType === "plaintext"){
                        var messageId = val.val().messageId;
                        var message =  `<div class="row no-gutters">
                                            <div class="col-md-6 offset-md-6">
                                                <div id="${"msg-"+messageId}" class="chat-bubble-sent-text">
                                                    ${val.val().message}
                                                    <span class="chat-time text-muted small">${time}
                                                        <i id="${"isRead-"+messageId} "class="material-icons"></i>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>`    
                        
                        document.getElementById('chatBody').innerHTML += message;
                        /*
                        if(val.val().isRead === true){
                            document.getElementById("isRead-"+messageId).value = done_all;
                        }else{
                            document.getElementById("isRead-"+messageId).value = done;
                        }*/
                    }else if(val.val().messageType === "image"){
                        var message =  `<div class="row no-gutters">
                                            <div class="col-md-6 offset-md-6">
                                                <div id="${"msg-"+messageId}" class="chat-bubble-sent-image">
                                                    <img src="${val.val().message}"/>
                                                </div>
                                                <span class="chat-time text-muted small">${time}
                                                        <i id="${"isRead-"+messageId} "class="material-icons"></i>
                                                </span>
                                            </div>
                                        </div>`   
        
                        document.getElementById('chatBody').innerHTML += message;
                    }       
                }else{
                    firebase.database().ref('chat_messages').child(chatID).child(val.key).update({isRead : 'true'}).then(function(){}).catch(function(error) {
                        console.log("Data could not be saved." + error);
                      });
      
                      if(val.val().messageType === "plaintext"){
                          var message = `<div class="row no-gutters">
                                            <div class="col-md-6">
                                                <div class="chat-bubble-recieved-text">
                                                    ${val.val().message}
                                                    <span class="chat-time text-muted small">${time}</span>
                                                </div>
                                            </div>
                                        </div>`;
                      document.getElementById('chatBody').innerHTML += message;
                      }
                      else if(val.val().messageType === "image"){
                        var message = `<div class="row no-gutters">
                                            <div class="col-md-6">
                                                <div class="chat-bubble-recieved-image">
                                                <img src="${val.val().message}"/>
                                                </div>
                                                <span class="chat-time text-muted small">${time}</span>
                                            </div>
                                        </div>`;
                        document.getElementById('chatBody').innerHTML += message;
                      }
                }
                i++;
                document.getElementById('chatBody').scrollTo(0,document.getElementById('chatBody').clientHeight);
            });
        });

    }
}

function getLastMessage(chatID){
    var messageId 
    console.log(chatID);
    firebase.database().ref('chat_messages').child(chatID).limitToLast(1).on('child_added', function(snapshot){
        messageId = snapshot.key
            var timestamp = moment.utc(parseInt(snapshot.val().timestamp));
            var time = timestamp.local().format("HH:mm");
            if(snapshot.val().sender === user.uid){

                if(snapshot.val().messageType === "plaintext"){
                        var message =  `<div class="row no-gutters">
                                            <div class="col-md-6 offset-md-6">
                                                <div id="${"msg-"+messageId}" class="chat-bubble-sent-text">
                                                    ${snapshot.val().message}
                                                    <span class="chat-time text-muted small">${time}
                                                        <i id="${"isRead-"+messageId}" class="material-icons"></i>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>`    
                        
                        document.getElementById('chatBody').innerHTML += message;
                        
                        if(snapshot.val().isRead === true){
                            document.getElementById("isRead-"+messageId).value = "done_all";
                        }else{
                            document.getElementById("isRead-"+messageId).value = "done";
                        }
                }
                else if(snapshot.val().messageType === "image"){
                    if(snapshot.val().message === ""){
                        var message =  `<div class="row no-gutters">
                                            <div class="col-md-6 offset-md-6">
                                                <div id="${"msg-"+messageId}" class="chat-bubble-sent-image">
                                                    <img id="${"img-"+messageId}" src="${val.val().message}"/>
                                                </div>
                                                <span class="chat-time text-muted small">${time.getHours() + ":" + time.getMinutes()}
                                                        <i id="${"isRead-"+messageId} "class="material-icons"></i>
                                                </span>
                                            </div>
                                        </div>`   

                        document.getElementById('chatBody').innerHTML += message;
                    }else{
                        var message =  `<div class="row no-gutters">
                                            <div class="col-md-6 offset-md-6">
                                                <div id="${"msg-"+messageId}" class="chat-bubble-sent-image">
                                                    <img id="${"img-"+messageId}" src="${snapshot.val().message}"/>
                                                </div>
                                                <span class="chat-time text-muted small">${time}
                                                        <i id="${"isRead-"+messageId} "class="material-icons" style="margin-right:15px;padding-bottom:15px"></i>
                                                </span>
                                            </div>
                                        </div>`   
                        document.getElementById('chatBody').innerHTML += message;
                    }   
                }     
            }else{
                firebase.database().ref('chat_messages').child(chatID).child(messageId).update({isRead : 'true'}).then(function(){
                   // console.log("Data saved successfully.");
                }).catch(function(error) {
                  console.log("Data could not be saved." + error);
                });
                if(snapshot.val().messageType === "plaintext"){
                    var message = `<div class="row no-gutters">
                                        <div class="col-md-6">
                                            <div class="chat-bubble-recieved-text">
                                                ${snapshot.val().message}
                                                <span class="chat-time text-muted small">${time}</span>
                                            </div>
                                        </div>
                                    </div>`;
                    document.getElementById('chatBody').innerHTML += message;
                }
                else if(snapshot.val().messageType === "image"){
                    if(snapshot.val().message === ""){
                        var message = `<div class="row no-gutters">
                                            <div class="col-md-6">
                                                <div class="chat-bubble-recieved-image">
                                                <img id="${"img-"+messageId}" src="${snapshot.val().message}"/>
                                                    <span class="chat-time text-muted small">${time}</span>
                                                </div>
                                            </div>
                                        </div>`;
                        document.getElementById('chatBody').innerHTML += message;
                    }else{
                        var message = `<div class="row no-gutters">
                                            <div class="col-md-6">
                                                <div class="chat-bubble-recieved-image">
                                                <img id="${"img-"+messageId}" src="${snapshot.val().message}"/>
                                                    <span class="chat-time text-muted small">${time}</span>
                                                </div>
                                            </div>
                                        </div>`;
                        document.getElementById('chatBody').innerHTML += message;
                    }
                }
            }
           document.getElementById('chatBody').scrollTo(0,document.getElementById('chatBody').clientHeight);
    });

    firebase.database().ref('chat_messages').child(chatID).limitToLast(1).on('child_changed',function(snapshot){
        if(snapshot.val().message === "" || snapshot.val().messageType === "plaintext"){
        }else{
            document.getElementById("img-"+messageId).src = snapshot.val().message;
        }
    });
};

//////////////////////////////////////////////////////////////////////////
//Sending a message

function onKeyDown(){
    document.addEventListener('keydown',function(key){
        if(key.which === 13){
            sendMessage();
        }
    });
}

function sendMessage(){ 
    if(document.getElementById('userMessageInput').value.trim() !== ''){
        var chatID = chat[2]
        var recipient = chat[3]

        if(flag === false){
            createNewChat();
        }

        if(chatID !== ""){
            var messageReference = firebase.database().ref('chat_messages').child(chatID);
            var newMessageID = messageReference.push().getKey();
        
            firebase.database().ref('chat_messages').child(chatID).child(newMessageID).set({
                chatId: chatID,
                isRead: 'false',
                message: document.getElementById('userMessageInput').value,
                messageId:newMessageID,
                messageType: 'plaintext',
                recipient: recipient,
                seenAt : '',
                sender: user.uid,
                timestamp: ((new Date().getTime()))
            })
        
            firebase.database().ref('user_chats_unread_messages').child(recipient).child(chatID).update({
                [newMessageID]:"",
            });

            var notificationsID = firebase.database().ref('notifications').child(recipient).push().getKey();
            
            firebase.database().ref('notifications').child(recipient).child(notificationsID).set({
                image: "",
                text : document.getElementById('userMessageInput').value,
                title : "PigeoTalk"
            });
        
            firebase.database().ref('chats').child(chatID).update({last_message_id: newMessageID}).then(function(){
            }).catch(function(error) {
            console.log("Data could not be saved." + error);
            });
        
            document.getElementById('userMessageInput').value = '';
            document.getElementById('userMessageInput').focus();
            document.getElementById('chatBody').scrollTo(0,document.getElementById('chatBody').clientHeight);
        }
    }
}    


//////////////////////////////////////////////////////////////////////////
//Create new chat
var contactChat;
var contactId;
var contactName;
var contactPicture;
function startChat(contact){
    contactId = contact[0];
    contactName = contact[1];
    contactPicture = contact[2]
    contactChat = contact;
    flag = false;
    document.getElementById('chatBody').innerHTML = ""

    firebase.database().ref('user_chats').child(user.uid).once('value', function(snapshot){
        console.log("Burada mısın")
        snapshot.forEach(function(val){
            if(val.val() === contactId){
                var chatId = val.key
                flag = true;
                displayChat([contactName,contactPicture,chatId,contactId]);
            }
        })
    })

    if(flag === false){
        displayChat([contactName,contactPicture,"",contactId]);
    }   
}

function createNewChat(){

    var newChatId = firebase.database().ref('chats').push().getKey();
    firebase.database().ref('chats').child(newChatId).child("members").update({
        [user.uid]:"",
    });

    firebase.database().ref('chats').child(newChatId).child("members").update({
        [contactId]:"",
    });

    firebase.database().ref('chats').child(newChatId).update({
        chatId:newChatId,
    });

    firebase.database().ref('chats').child(newChatId).update({
        last_message_id:"",
    });

    firebase.database().ref('user_chats').child(user.uid).update({
        [newChatId]:contactId,
    });

    firebase.database().ref('user_chats').child(contactId).update({
        [newChatId]:user.uid,
    });

    firebase.database().ref('user_chats').child(user.uid).once('value', function(snapshot){
        snapshot.forEach(function(val){
            if(val.val() === contactId){
                var chatId = val.key
                flag = true;

                var messageReference = firebase.database().ref('chat_messages').child(chatId);
                var newMessageID = messageReference.push().getKey();
            
            
                firebase.database().ref('chat_messages').child(chatId).child(newMessageID).set({
                    chatId: chatId,
                    isRead: 'false',
                    message: document.getElementById('userMessageInput').value,
                    messageId:newMessageID,
                    messageType: 'plaintext',
                    recipient: contactId,
                    seenAt : '',
                    sender: user.uid,
                    timestamp: ((new Date().getTime()))
                })

                var notificationsID = firebase.database().ref('notifications').child(contactId).push().getKey();
        
                firebase.database().ref('notifications').child(contactId).child(notificationsID).set({
                    image: "",
                    text : document.getElementById('userMessageInput').value,
                    title : "PigeoTalk"
                });
            
                firebase.database().ref('chats').child(chatId).update({last_message_id: newMessageID}).then(function(){
                }).catch(function(error) {
                console.log("Data could not be saved." + error);
                });
            
                document.getElementById('userMessageInput').value = '';
                document.getElementById('userMessageInput').focus();
                document.getElementById('chatBody').scrollTo(0,document.getElementById('chatBody').clientHeight);

               displayChat([contactName,contactPicture,chatId,contactId]);
            }
        });
    });
}


function sendImage(){
    document.getElementById('uploadImage').click();
};

function uploadImage(event){
    var blob = new Blob([event.files[0]], { type: "image/jpeg" }); 

    var chatID = chat[2]
    var recipient = chat[3]
    var messageReference = firebase.database().ref('chat_messages').child(chatID);
    var newMessageID = messageReference.push().getKey();

    if(chatID !== null){
        var time = new Date().getTime();
        firebase.storage().ref('chats').child(chatID).child('image').child("IMAGE_"+time).put(blob).then(function(snapshot){
            snapshot.ref.getDownloadURL().then(function(downloadURL){
                firebase.database().ref('chat_messages').child(chatID).child(newMessageID).set({
                    chatId: chatID,
                    isRead: 'false',
                    message: downloadURL,
                    messageId:newMessageID,
                    messageType: 'image',
                    recipient: recipient,
                    seenAt : '',
                    sender: user.uid,
                    timestamp: ((new Date().getTime()))
                });

                var notificationsID = firebase.database().ref('notifications').child(recipient).push().getKey();
                firebase.database().ref('notifications').child(recipient).child(notificationsID).set({
                    image: downloadURL,
                    text : "\uD83D\uDCF7 Photo",
                    title : "PigeoTalk"
                });

                firebase.database().ref('chats').child(chatID).update({last_message_id: newMessageID}).then(function(){
                }).catch(function(error) {
                  console.log("Data could not be saved." + error);
                });
            });
        });
    }
}

























////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//PROFILE INFORMATION

//ChatListTray Profile Picture
function getUserInformation(){
    document.getElementById('profileTrayImage').src = user.profile_photo_url
}

function getUserProfileInformation(){
    document.getElementById('userProfilePicture').src = user.profile_photo_url;
    document.getElementById('userProfileName').value = user.name;
    document.getElementById('userProfileAbout').value = user.about;
};

//Profile About
function editAbout(){
    document.getElementById('cancelEditAbout').removeAttribute('style');
    document.getElementById('cancelEditAbout').setAttribute('style','cursor: pointer;size:5px;margin-left: 20px;');

    document.getElementById('acceptEditAbout').removeAttribute('style');
    document.getElementById('acceptEditAbout').setAttribute('style','cursor: pointer;size:5px;margin-left: 5px;');

    document.getElementById('editAbout').setAttribute('style','display:none');
    document.getElementById('userProfileAbout').disabled = false;
}
function cancelEditAbout(){
    document.getElementById('userProfileAbout').value = user.about;
    document.getElementById('acceptEditAbout').setAttribute('style','display:none');
    document.getElementById('cancelEditAbout').setAttribute('style','display:none');

    document.getElementById('editAbout').removeAttribute('style');
    document.getElementById('editAbout').setAttribute('style','cursor: pointer;size: 5px ;margin-left: 20px;');
    document.getElementById('userProfileAbout').disabled = true;
}
function acceptEditAbout(){
    var userAbout = document.getElementById('userProfileAbout').value;

    if(user.about !== userAbout){
        firebase.database().ref('users').child(user.uid).update({about: userAbout});
        console.log("Not same");
    }else{
        console.log("Same");
    }
    document.getElementById('acceptEditAbout').setAttribute('style','display:none');
    document.getElementById('cancelEditAbout').setAttribute('style','display:none');
    document.getElementById('editAbout').removeAttribute('style');
    document.getElementById('editAbout').setAttribute('style','cursor: pointer;size: 5px ;margin-left: 20px;');
    document.getElementById('userProfileAbout').disabled = true;
}

//Profile name
function editName(){
    document.getElementById('cancelEditName').removeAttribute('style');
    document.getElementById('cancelEditName').setAttribute('style','cursor: pointer;size:5px;margin-left: 20px;');

    document.getElementById('acceptEditName').removeAttribute('style');
    document.getElementById('acceptEditName').setAttribute('style','cursor: pointer;size:5px;margin-left: 5px;');

    document.getElementById('editName').setAttribute('style','display:none');
    document.getElementById('userProfileName').disabled = false;
}
function cancelEditName(){
    document.getElementById('userProfileName').value = user.name;
    document.getElementById('acceptEditName').setAttribute('style','display:none');
    document.getElementById('cancelEditName').setAttribute('style','display:none');

    document.getElementById('editName').removeAttribute('style');
    document.getElementById('editName').setAttribute('style','cursor: pointer;size: 5px ;margin-left: 20px;');
    document.getElementById('userProfileName').disabled = true;
}
function acceptEditName(){
    var userName = document.getElementById('userProfileName').value;

    if(user.name !== userName){
        firebase.database().ref('users').child(user.uid).update({name: userName});
    }
    document.getElementById('acceptEditName').setAttribute('style','display:none');
    document.getElementById('cancelEditName').setAttribute('style','display:none');
    document.getElementById('editName').removeAttribute('style');
    document.getElementById('editName').setAttribute('style','cursor: pointer;size: 5px ;margin-left: 20px;');
    document.getElementById('userProfileName').disabled = true;

    firebase.auth().currentUser.updateProfile({
        displayName: userName,
        photoURL: user.profile_photo_url
      }).then(function() {
      }).catch(function(error) {
          console.log(error);
      });

}

//Profile Picture
function selectProfilePicture(){
    document.getElementById('getImage').click();
}

function uploadProfilePicture(event){
    var blob = new Blob([event.files[0]], { type: "image/jpeg" }); 

        firebase.storage().ref(user.uid).child("pp.jpeg").put(blob).then(function(snapshot){
            snapshot.ref.getDownloadURL().then(function(downloadURL){
                firebase.database().ref('users').child(user.uid).update({profile_photo_url: downloadURL});
                document.getElementById('userProfilePicture').src = downloadURL;

                firebase.auth().currentUser.updateProfile({
                    displayName: user.name,
                    photoURL: downloadURL
                  }).then(function(){
                     // console.log(firebase.auth().currentUser.photoURL)
                  }).catch(function(error) {
                    console.log(error)
                  });
            });
        }).catch(function(error) {
            console.log("Data could not be saved." + error);
        });
}


//////////////////////////////////////////////////
//DISPLAY FUNCTIONS
function displayProfileInformation(){
    getUserProfileInformation();
    document.getElementById('userProfileAbout').disabled = true;
    document.getElementById('userProfileName').disabled = true;
    document.getElementById('chatListPanel').setAttribute('style','display:none');
    document.getElementById('profileInformationPanel').removeAttribute('style');
};

function displayContactList(){
    getAllContacts();
    document.getElementById('contactListPanel').removeAttribute('style');
    document.getElementById('chatListPanel').setAttribute('style','display:none');
}

function displayChat(contact){
    getAllMessages(contact);
    document.getElementById('mainChatPanel').removeAttribute('style');
    document.getElementById('emptyPanel').setAttribute('style',"display:none");
}

function displayChatList(id){
    document.getElementById('chatListPanel').removeAttribute('style');
    document.getElementById(id).setAttribute('style',"display:none");
}

/*firebase.database().ref.child("users").child(mFirebaseAuth.getUid()).child("presence")
                .child("isOnline").onDisconnect().setValue("false");

        mDatabaseReference.child("users").child(mFirebaseAuth.getUid()).child("presence")
                .child("last_seen").onDisconnect().setValue(System.currentTimeMillis());*/