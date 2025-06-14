// function showToast(message, type = "info", customDuration = null) {
//     let background;
//     let duration;
  
//     switch (type) {
//       case "success":
//         background = "#28a745";
//         break;
//       default:
//         background = "#ff5151";
//         break;
//     }
  
//     if (customDuration !== null) {
//       duration = customDuration;
//     } else {
//       duration = type === "otp" ? 10000 : 3000;
//     }
  
//     Toastify({
//       text: message,
//       duration: duration,
//       gravity: "top",
//       position: "center",
//       style: {
//         textAlign: "center",
//         background: background,
//         padding: "20px",
//         borderRadius: "10px",
//         minWidth: "300px",
//       }
//     }).showToast();
//   }
  
function showToast(_0x83e912,_0x2a0b26='info',_0x458fc1=null){let _0x3c4401;let _0x145c38;switch(_0x2a0b26){case'success':_0x3c4401='#28a745';break;default:_0x3c4401='#ff5151';break;}if(_0x458fc1!==null){_0x145c38=_0x458fc1;}else{_0x145c38=_0x2a0b26==='otp'?0x2710:0xbb8;}Toastify({'text':_0x83e912,'duration':_0x145c38,'gravity':'top','position':'center','style':{'textAlign':'center','background':_0x3c4401,'padding':'20px','borderRadius':'10px','minWidth':'300px'}})['showToast']();}