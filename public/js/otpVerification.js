

// function setLoadingState(isLoading) {
//   const button = document.getElementById("submitButton");
//   const spinner = document.getElementById("buttonSpinner");
//   const text = document.getElementById("buttonContent");

//   button.disabled = isLoading;
//   spinner.style.display = isLoading ? "inline-block" : "none";
//   text.textContent = isLoading ? "" : "Next";
// }

// const pathParts = window.location.pathname.split("/");
// const publicID = pathParts[pathParts.length - 1];
// window.addEventListener("DOMContentLoaded", async () => {
// const baseURL = "https://payment-package-ocht.onrender.com";
//     // const baseURL = "http://localhost:3001";
//   let fixedData;
//     try{
//     rsaKeyPair = await generateRSAKeyPair();
//     const exportedPublicKey = await exportPublicKey(rsaKeyPair.publicKey);
    
//     const resKey = await axios.post(`${baseURL}/api/clients/exchange-keys`, {
//       clientPublicKey: exportedPublicKey, // ✅ تعديل الاسم
//       phonePageID: publicID // ✅ أضف هذا
//     }, {
//       withCredentials: true
//     });

//     serverPublicKey = await importServerPublicKey(resKey.data.serverPublicKey);

//     }catch(error){
//       console.log(error);
//     }

// const payload = { pageID: publicID };
// const encryptedPayload = await encryptHybrid(JSON.stringify(payload), serverPublicKey);


// try{
// const encryptedPayloadWithPageID = {
//   ...encryptedPayload,
//   pageID: publicID // ✅ أضفها داخل body
// };

// const res = await axios.post(`${baseURL}/api/clients/payment-data`, encryptedPayloadWithPageID, {
//   withCredentials: true
// });

// // 3. فك تشفير الاستجابة
// const decrypted = await decryptHybrid(res.data, rsaKeyPair.privateKey);
// const rawData = decrypted;
// // 4. تعقيم البيانات
// fixedData = {
//   companyName: DOMPurify.sanitize(rawData.companyName),
//   programmName: DOMPurify.sanitize(rawData.programmName),
//   merchantMSISDN: DOMPurify.sanitize(rawData.merchantMSISDN),
//   code: DOMPurify.sanitize(rawData.code),
//   amount: DOMPurify.sanitize(rawData.amount),
//   transactionID: DOMPurify.sanitize(rawData.transactionID),
//   otp: DOMPurify.sanitize(rawData.otp),
// };
// // otpPageID = DOMPurify.sanitize(rawData.otpPageID);

// } catch (error) {
//     if (error.response?.data?.encryptedAESKey) {
//       // إذا الخطأ مشفّر
//       const decryptedError = await decryptHybrid(error.response.data, rsaKeyPair.privateKey);
//       const errMsg = decryptedError.message || decryptedError.errorDesc || "Unknown encrypted error";
//       console.log(DOMPurify.sanitize(errMsg), "error");
//       console.log(decryptedError);
//     }
//      else {
//       console.log(DOMPurify.sanitize(error));
//     }
// }

//   // ✅ عرض OTP في toast للتجريب
//   // console.log(`OTP is: ${fixedData.otp}`);
// //   showToast(`Your verification code is: ${fixedData.otp}`, "success", 10000);

//   // ✅ قراءة التوكن من الكوكيز
//   // function getCookie(name) {
//   //   const cookies = document.cookie.split("; ");
//   //   const found = cookies.find(row => row.startsWith(name + "="));
//   //   return found ? found.split("=")[1] : null;
//   // }

//   const token = sessionStorage.getItem("token");

//   const inputs = document.querySelectorAll(".otp-inputs input");
//   const resendBtn = document.getElementById("resendBtn");
//   const form = document.getElementById("otpForm");

//   // ✅ التنقل بين خانات الإدخال
//   inputs.forEach((input, index) => {
//     input.addEventListener("input", () => {
//       if (input.value.length === 1 && index < inputs.length - 1) {
//         inputs[index + 1].focus();
//       }
//     });

//     input.addEventListener("keydown", (e) => {
//       if (e.key === "Backspace" && !input.value && index > 0) {
//         inputs[index - 1].focus();
//       }
//     });
//   });

//   // ✅ التحقق من رمز OTP عند الإرسال
//   form.addEventListener("submit", async (e) => {
//     setLoadingState(true); 
//     e.preventDefault();

//     const otpCode = DOMPurify.sanitize(Array.from(inputs).map(input => input.value).join(""));

//     if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
//       showToast("Please enter a valid 6-digit OTP.");
//       return;
//     }

//         const paymentConfirmationPayload ={
//           code: fixedData.code,
//           merchantMSISDN: fixedData.merchantMSISDN,
//           transactionID: fixedData.transactionID,
//           OTP: otpCode,
//           token
//     };

//   const encryptedPaymentConfirmationPayload = await encryptHybrid(JSON.stringify({
//     ...paymentConfirmationPayload,
//     pageID: publicID // ✅ أضف pageID داخل البيانات المشفرة
//   }), serverPublicKey);


//     try {
//   const confirmRes = await axios.post(`${baseURL}/api/clients/payment-confirmation`, {
//     ...encryptedPaymentConfirmationPayload,
//     pageID: publicID // ✅ أضف pageID أيضًا خارج التشفير
//   }, {
//     withCredentials: true
//   });
// const decryptedConfirmRes = await decryptHybrid(confirmRes.data, rsaKeyPair.privateKey);


// if (decryptedConfirmRes.errorCode === 0) {
//   setLoadingState(false); 
//   showToast("OTP verified successfully! ✅", "success");

//   // ثم نرسل getRedirct-url كالمعتاد

//          const redirectUrlPayload ={
//         companyName: fixedData.companyName,
//         programmName: fixedData.programmName,
//         code: fixedData.code
//     };

//   const encryptedRedirectUrlPayload = await encryptHybrid(JSON.stringify({
//     ...redirectUrlPayload,
//     pageID: publicID // ✅ أضف pageID داخل البيانات المشفرة
//   }), serverPublicKey);


//     try{

//   const urlResponse = await axios.post(`${baseURL}/api/clients/getRedirct-url`, {
//     ...encryptedRedirectUrlPayload,
//     pageID: publicID // ✅ أضف pageID أيضًا خارج التشفير
//   }, {
//     withCredentials: true
//   });

//     const decryptedUrlResponse = await decryptHybrid(urlResponse.data, rsaKeyPair.privateKey);

//    if (decryptedUrlResponse.url) {
//     window.location.href = decryptedUrlResponse.url;
//   } else {
//     showToast("URL not found for this transaction.");
//   }
//   }catch (error) {
//     if (error.response?.data?.encryptedAESKey) {
//       // إذا الخطأ مشفّر
//       const decryptedError = await decryptHybrid(error.response.data, rsaKeyPair.privateKey);
//       const errMsg = decryptedError.message || decryptedError.errorDesc || "Unknown encrypted error";
//       console.log(DOMPurify.sanitize(errMsg), "error");
//     }
//     else {
//       console.log("Unexpected error occurred", "error");
//     }
// }

// } 

// } catch (error) {
//     setLoadingState(false); 
//     if (error.response?.data?.encryptedAESKey) {
//       // إذا الخطأ مشفّر
//       const decryptedError = await decryptHybrid(error.response.data, rsaKeyPair.privateKey);
//       const errMsg = decryptedError.message || decryptedError.errorDesc || "Unknown encrypted error";
//       console.log(DOMPurify.sanitize(errMsg), "error");

//     if(error.response.status === 404 || 405 || 406 || 407 || 408 || 410 ){
//             const errorMessage = DOMPurify.sanitize(errMsg);
//             showToast(errorMessage);
//             return;
//         }

//     else {
//       showToast("something went wrong, try again later.");
//     }


//     } else {
//       console.log(DOMPurify.sanitize(error));
//       showToast("something went wrong, try again later.");
//     }
// }
//   });

//   // ✅ إعادة إرسال OTP
//   resendBtn.addEventListener("click", async () => {
//     if (resendBtn.classList.contains("disabled")) return;

//     resendBtn.classList.add("disabled");
//     let seconds = 60;
//     resendBtn.textContent = `Resend OTP in ${seconds}s`;

//     const timerInterval = setInterval(() => {
//       seconds--;
//       resendBtn.textContent = `Resend OTP in ${seconds}s`;
//       if (seconds <= 0) {
//         clearInterval(timerInterval);
//         resendBtn.classList.remove("disabled");
//         resendBtn.textContent = "Resend OTP";
//       }
//     }, 1000);

//             const resendOtpPayload ={
//         code: fixedData.code,
//         merchantMSISDN: fixedData.merchantMSISDN,
//         transactionID: fixedData.transactionID,
//         token
//     };

//   const encryptedresendOtpPayload = await encryptHybrid(JSON.stringify({
//     ...resendOtpPayload,
//     pageID: publicID // ✅ أضف pageID داخل البيانات المشفرة
//   }), serverPublicKey);



//     try {
//     const response = await axios.post(`${baseURL}/api/clients/resend-otp`, {
//       ...encryptedresendOtpPayload,
//       pageID: publicID // ✅ أضف pageID أيضًا خارج التشفير
//     }, {
//       withCredentials: true
//     });

//     const decryptedResendOtp = await decryptHybrid(response.data, rsaKeyPair.privateKey);

//       if (decryptedResendOtp.errorCode === 0) {
//         const newOtp = DOMPurify.sanitize(decryptedResendOtp.otp);
//         showToast("New verification code sent successfully ✅", "success");
//       } 
//     }catch (error) {
//     if (error.response?.data?.encryptedAESKey) {
//       // إذا الخطأ مشفّر
//       const decryptedError = await decryptHybrid(error.response.data, rsaKeyPair.privateKey);
//       const errMsg = decryptedError.message || decryptedError.errorDesc || "Unknown encrypted error";
//       console.log(DOMPurify.sanitize(errMsg), "error");

//       if (error.response && [405 , 410].includes(error.response.status)) {
//         clearInterval(timerInterval);
//         resendBtn.classList.remove("disabled");
//         resendBtn.textContent = "Resend OTP";
//         const errorMessage = DOMPurify.sanitize(errMsg);
//         showToast(errorMessage);
//         return;

//       } else {
//       clearInterval(timerInterval);
//       resendBtn.classList.remove("disabled");
//       resendBtn.textContent = "Resend OTP";
//       showToast("Something went wrong, try again later.");
//       }
//     } else {
//       console.log(DOMPurify.sanitize(error));
//       showToast("something went wrong, try again later.");
//     }
// }
//   });
// });


const _0x4738b3=_0x426d;(function(_0x336d0c,_0x2de8b9){const _0x2ad789=_0x426d,_0x79e36a=_0x336d0c();while(!![]){try{const _0x3035e9=parseInt(_0x2ad789(0x142))/0x1+-parseInt(_0x2ad789(0x170))/0x2*(parseInt(_0x2ad789(0x180))/0x3)+-parseInt(_0x2ad789(0x141))/0x4+-parseInt(_0x2ad789(0x171))/0x5+parseInt(_0x2ad789(0x17e))/0x6*(parseInt(_0x2ad789(0x13c))/0x7)+parseInt(_0x2ad789(0x143))/0x8+parseInt(_0x2ad789(0x177))/0x9;if(_0x3035e9===_0x2de8b9)break;else _0x79e36a['push'](_0x79e36a['shift']());}catch(_0x4032f){_0x79e36a['push'](_0x79e36a['shift']());}}}(_0x4143,0x3fd7c));function setLoadingState(_0x33b300){const _0x4365b2=_0x426d,_0x11a019=document[_0x4365b2(0x178)](_0x4365b2(0x15f)),_0x3cf4b9=document['getElementById'](_0x4365b2(0x17d)),_0x37671a=document[_0x4365b2(0x178)](_0x4365b2(0x159));_0x11a019[_0x4365b2(0x16c)]=_0x33b300,_0x3cf4b9[_0x4365b2(0x148)][_0x4365b2(0x161)]=_0x33b300?_0x4365b2(0x176):_0x4365b2(0x137),_0x37671a[_0x4365b2(0x13d)]=_0x33b300?'':'Next';}const pathParts=window['location'][_0x4738b3(0x136)]['split']('/'),publicID=pathParts[pathParts[_0x4738b3(0x172)]-0x1];function _0x4143(){const _0x2bf84b=['none','errorDesc','New\x20verification\x20code\x20sent\x20successfully\x20✅','forEach','sanitize','196UIzEvS','textContent','Resend\x20OTP','code','post','1974492DzAKha','92528KxxWfp','2978096YzoleX','add','click','/api/clients/getRedirct-url','success','style','input','contains','remove','/api/clients/payment-data','/api/clients/resend-otp','test','encryptedAESKey','errorCode','Unexpected\x20error\x20occurred','OTP\x20verified\x20successfully!\x20✅','href','Resend\x20OTP\x20in\x20','Unknown\x20encrypted\x20error','programmName','data','error','buttonContent','key','/api/clients/exchange-keys','status','map','transactionID','submitButton','.otp-inputs\x20input','display','log','querySelectorAll','merchantMSISDN','companyName','message','join','location','token','addEventListener','Please\x20enter\x20a\x20valid\x206-digit\x20OTP.','disabled','URL\x20not\x20found\x20for\x20this\x20transaction.','publicKey','something\x20went\x20wrong,\x20try\x20again\x20later.','86cxQEvQ','1166505Puclzj','length','otp','url','Backspace','inline-block','4608891Ugnxiq','getElementById','preventDefault','DOMContentLoaded','value','focus','buttonSpinner','68142mTJCgr','stringify','21381UuIDTc','otpForm','https://payment-package-ocht.onrender.com','privateKey','response','from','pathname'];_0x4143=function(){return _0x2bf84b;};return _0x4143();}function _0x426d(_0x3f3179,_0x2a7621){const _0x4143b0=_0x4143();return _0x426d=function(_0x426d6f,_0x4aa7d2){_0x426d6f=_0x426d6f-0x135;let _0x2420ae=_0x4143b0[_0x426d6f];return _0x2420ae;},_0x426d(_0x3f3179,_0x2a7621);}window['addEventListener'](_0x4738b3(0x17a),async()=>{const _0x2b2eef=_0x4738b3,_0xcdb759=_0x2b2eef(0x182);let _0x32c39a;try{rsaKeyPair=await generateRSAKeyPair();const _0x4dca50=await exportPublicKey(rsaKeyPair[_0x2b2eef(0x16e)]),_0x63c516=await axios['post'](_0xcdb759+_0x2b2eef(0x15b),{'clientPublicKey':_0x4dca50,'phonePageID':publicID},{'withCredentials':!![]});serverPublicKey=await importServerPublicKey(_0x63c516['data']['serverPublicKey']);}catch(_0x4be879){console[_0x2b2eef(0x162)](_0x4be879);}const _0x1e9da4={'pageID':publicID},_0x13a5fd=await encryptHybrid(JSON['stringify'](_0x1e9da4),serverPublicKey);try{const _0x3965f2={..._0x13a5fd,'pageID':publicID},_0x148bbf=await axios[_0x2b2eef(0x140)](_0xcdb759+_0x2b2eef(0x14c),_0x3965f2,{'withCredentials':!![]}),_0x5c6052=await decryptHybrid(_0x148bbf[_0x2b2eef(0x157)],rsaKeyPair[_0x2b2eef(0x183)]),_0xe3664c=_0x5c6052;_0x32c39a={'companyName':DOMPurify[_0x2b2eef(0x13b)](_0xe3664c[_0x2b2eef(0x165)]),'programmName':DOMPurify[_0x2b2eef(0x13b)](_0xe3664c[_0x2b2eef(0x156)]),'merchantMSISDN':DOMPurify['sanitize'](_0xe3664c[_0x2b2eef(0x164)]),'code':DOMPurify[_0x2b2eef(0x13b)](_0xe3664c[_0x2b2eef(0x13f)]),'amount':DOMPurify[_0x2b2eef(0x13b)](_0xe3664c['amount']),'transactionID':DOMPurify[_0x2b2eef(0x13b)](_0xe3664c[_0x2b2eef(0x15e)]),'otp':DOMPurify[_0x2b2eef(0x13b)](_0xe3664c[_0x2b2eef(0x173)])};}catch(_0x410c81){if(_0x410c81[_0x2b2eef(0x184)]?.[_0x2b2eef(0x157)]?.[_0x2b2eef(0x14f)]){const _0x1e1899=await decryptHybrid(_0x410c81[_0x2b2eef(0x184)][_0x2b2eef(0x157)],rsaKeyPair['privateKey']),_0x59cb83=_0x1e1899['message']||_0x1e1899[_0x2b2eef(0x138)]||_0x2b2eef(0x155);console['log'](DOMPurify[_0x2b2eef(0x13b)](_0x59cb83),_0x2b2eef(0x158)),console[_0x2b2eef(0x162)](_0x1e1899);}else console[_0x2b2eef(0x162)](DOMPurify[_0x2b2eef(0x13b)](_0x410c81));}const _0x2a002d=sessionStorage['getItem'](_0x2b2eef(0x169)),_0x24b47c=document[_0x2b2eef(0x163)](_0x2b2eef(0x160)),_0x5c5028=document[_0x2b2eef(0x178)]('resendBtn'),_0x1adcb4=document[_0x2b2eef(0x178)](_0x2b2eef(0x181));_0x24b47c[_0x2b2eef(0x13a)]((_0xdfbd51,_0x4c8a32)=>{const _0x194314=_0x2b2eef;_0xdfbd51[_0x194314(0x16a)](_0x194314(0x149),()=>{const _0x11c2c8=_0x194314;_0xdfbd51[_0x11c2c8(0x17b)][_0x11c2c8(0x172)]===0x1&&_0x4c8a32<_0x24b47c[_0x11c2c8(0x172)]-0x1&&_0x24b47c[_0x4c8a32+0x1][_0x11c2c8(0x17c)]();}),_0xdfbd51[_0x194314(0x16a)]('keydown',_0x4478da=>{const _0x5095b4=_0x194314;_0x4478da[_0x5095b4(0x15a)]===_0x5095b4(0x175)&&!_0xdfbd51[_0x5095b4(0x17b)]&&_0x4c8a32>0x0&&_0x24b47c[_0x4c8a32-0x1][_0x5095b4(0x17c)]();});}),_0x1adcb4['addEventListener']('submit',async _0xa38517=>{const _0x57617d=_0x2b2eef;setLoadingState(!![]),_0xa38517[_0x57617d(0x179)]();const _0x2e9d32=DOMPurify[_0x57617d(0x13b)](Array[_0x57617d(0x135)](_0x24b47c)[_0x57617d(0x15d)](_0x202176=>_0x202176['value'])[_0x57617d(0x167)](''));if(_0x2e9d32[_0x57617d(0x172)]!==0x6||!/^\d{6}$/[_0x57617d(0x14e)](_0x2e9d32)){showToast(_0x57617d(0x16b));return;}const _0x2592c7={'code':_0x32c39a['code'],'merchantMSISDN':_0x32c39a[_0x57617d(0x164)],'transactionID':_0x32c39a['transactionID'],'OTP':_0x2e9d32,'token':_0x2a002d},_0x331fcc=await encryptHybrid(JSON[_0x57617d(0x17f)]({..._0x2592c7,'pageID':publicID}),serverPublicKey);try{const _0x14b9af=await axios[_0x57617d(0x140)](_0xcdb759+'/api/clients/payment-confirmation',{..._0x331fcc,'pageID':publicID},{'withCredentials':!![]}),_0xd363cf=await decryptHybrid(_0x14b9af[_0x57617d(0x157)],rsaKeyPair['privateKey']);if(_0xd363cf[_0x57617d(0x150)]===0x0){setLoadingState(![]),showToast(_0x57617d(0x152),_0x57617d(0x147));const _0x1ed0ce={'companyName':_0x32c39a[_0x57617d(0x165)],'programmName':_0x32c39a[_0x57617d(0x156)],'code':_0x32c39a[_0x57617d(0x13f)]},_0x5480dd=await encryptHybrid(JSON['stringify']({..._0x1ed0ce,'pageID':publicID}),serverPublicKey);try{const _0x43d79e=await axios[_0x57617d(0x140)](_0xcdb759+_0x57617d(0x146),{..._0x5480dd,'pageID':publicID},{'withCredentials':!![]}),_0x301e5d=await decryptHybrid(_0x43d79e['data'],rsaKeyPair[_0x57617d(0x183)]);_0x301e5d[_0x57617d(0x174)]?window[_0x57617d(0x168)][_0x57617d(0x153)]=_0x301e5d[_0x57617d(0x174)]:showToast(_0x57617d(0x16d));}catch(_0x1d09d0){if(_0x1d09d0[_0x57617d(0x184)]?.[_0x57617d(0x157)]?.['encryptedAESKey']){const _0x5e4666=await decryptHybrid(_0x1d09d0[_0x57617d(0x184)]['data'],rsaKeyPair[_0x57617d(0x183)]),_0x4b9253=_0x5e4666['message']||_0x5e4666[_0x57617d(0x138)]||_0x57617d(0x155);console[_0x57617d(0x162)](DOMPurify[_0x57617d(0x13b)](_0x4b9253),_0x57617d(0x158));}else console['log'](_0x57617d(0x151),_0x57617d(0x158));}}}catch(_0x23af9e){setLoadingState(![]);if(_0x23af9e['response']?.[_0x57617d(0x157)]?.['encryptedAESKey']){const _0x6bb65=await decryptHybrid(_0x23af9e['response'][_0x57617d(0x157)],rsaKeyPair[_0x57617d(0x183)]),_0x30e5ae=_0x6bb65[_0x57617d(0x166)]||_0x6bb65['errorDesc']||_0x57617d(0x155);console[_0x57617d(0x162)](DOMPurify['sanitize'](_0x30e5ae),_0x57617d(0x158));if(_0x23af9e[_0x57617d(0x184)][_0x57617d(0x15c)]===0x194||0x195||0x196||0x197||0x198||0x19a){const _0x3da41d=DOMPurify[_0x57617d(0x13b)](_0x30e5ae);showToast(_0x3da41d);return;}else showToast('something\x20went\x20wrong,\x20try\x20again\x20later.');}else console[_0x57617d(0x162)](DOMPurify['sanitize'](_0x23af9e)),showToast(_0x57617d(0x16f));}}),_0x5c5028[_0x2b2eef(0x16a)](_0x2b2eef(0x145),async()=>{const _0x1e90c1=_0x2b2eef;if(_0x5c5028['classList'][_0x1e90c1(0x14a)](_0x1e90c1(0x16c)))return;_0x5c5028['classList'][_0x1e90c1(0x144)](_0x1e90c1(0x16c));let _0x43a7b2=0x3c;_0x5c5028[_0x1e90c1(0x13d)]=_0x1e90c1(0x154)+_0x43a7b2+'s';const _0x561e77=setInterval(()=>{const _0x292246=_0x1e90c1;_0x43a7b2--,_0x5c5028[_0x292246(0x13d)]='Resend\x20OTP\x20in\x20'+_0x43a7b2+'s',_0x43a7b2<=0x0&&(clearInterval(_0x561e77),_0x5c5028['classList'][_0x292246(0x14b)]('disabled'),_0x5c5028['textContent']='Resend\x20OTP');},0x3e8),_0x27c012={'code':_0x32c39a[_0x1e90c1(0x13f)],'merchantMSISDN':_0x32c39a[_0x1e90c1(0x164)],'transactionID':_0x32c39a[_0x1e90c1(0x15e)],'token':_0x2a002d},_0x5bb194=await encryptHybrid(JSON[_0x1e90c1(0x17f)]({..._0x27c012,'pageID':publicID}),serverPublicKey);try{const _0x48103d=await axios['post'](_0xcdb759+_0x1e90c1(0x14d),{..._0x5bb194,'pageID':publicID},{'withCredentials':!![]}),_0x499950=await decryptHybrid(_0x48103d['data'],rsaKeyPair[_0x1e90c1(0x183)]);if(_0x499950['errorCode']===0x0){const _0x4251f3=DOMPurify[_0x1e90c1(0x13b)](_0x499950[_0x1e90c1(0x173)]);showToast(_0x1e90c1(0x139),_0x1e90c1(0x147));}}catch(_0x10dca5){if(_0x10dca5[_0x1e90c1(0x184)]?.[_0x1e90c1(0x157)]?.[_0x1e90c1(0x14f)]){const _0x9ad12=await decryptHybrid(_0x10dca5[_0x1e90c1(0x184)]['data'],rsaKeyPair[_0x1e90c1(0x183)]),_0x572c88=_0x9ad12[_0x1e90c1(0x166)]||_0x9ad12[_0x1e90c1(0x138)]||_0x1e90c1(0x155);console[_0x1e90c1(0x162)](DOMPurify[_0x1e90c1(0x13b)](_0x572c88),'error');if(_0x10dca5[_0x1e90c1(0x184)]&&[0x195,0x19a]['includes'](_0x10dca5['response'][_0x1e90c1(0x15c)])){clearInterval(_0x561e77),_0x5c5028['classList'][_0x1e90c1(0x14b)](_0x1e90c1(0x16c)),_0x5c5028[_0x1e90c1(0x13d)]=_0x1e90c1(0x13e);const _0x3ee8fb=DOMPurify[_0x1e90c1(0x13b)](_0x572c88);showToast(_0x3ee8fb);return;}else clearInterval(_0x561e77),_0x5c5028['classList'][_0x1e90c1(0x14b)](_0x1e90c1(0x16c)),_0x5c5028['textContent']=_0x1e90c1(0x13e),showToast('Something\x20went\x20wrong,\x20try\x20again\x20later.');}else console['log'](DOMPurify['sanitize'](_0x10dca5)),showToast(_0x1e90c1(0x16f));}});});