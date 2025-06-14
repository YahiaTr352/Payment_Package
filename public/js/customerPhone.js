// function setPageLoadingState(isLoading) {
//   const spinner = document.getElementById("loadingSpinner");
//   const content = document.getElementById("phonePage");

//   spinner.style.display = isLoading ? "flex" : "none";
//   content.style.display = isLoading ? "none" : "flex";
// }

// function setLoadingState(isLoading) {
//   const button = document.getElementById("submitButton");
//   const spinner = document.getElementById("buttonSpinner");
//   const text = document.getElementById("buttonContent");

//   button.disabled = isLoading;
//   spinner.style.display = isLoading ? "inline-block" : "none";
//   text.textContent = isLoading ? "" : "Next";
// }

// const baseURL = "https://payment-package-ocht.onrender.com";
// // const baseURL = "http://localhost:3001";

// async function sendData() {
//   setPageLoadingState(true); // أظهر الشيمر أول ما تبدأ
//           const pathParts = window.location.pathname.split("/");
//         const publicID = pathParts[pathParts.length - 1];
//   try {
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

// // const payload = { pageID: publicID };
// // const encryptedPayload = await encryptHybrid(JSON.stringify(payload), serverPublicKey);

// // 2. إرسال الطلب المشفر بـ POST
// try{
  
// const encryptedPayloadWithPageID = {
//   pageID: publicID // ✅ أضفها داخل body
// };

// const res = await axios.post(`${baseURL}/api/clients/payment-data`, encryptedPayloadWithPageID, {
//   withCredentials: true
// });

//   const decrypted = await decryptHybrid(res.data, rsaKeyPair.privateKey);

//   let rawData;
//   if (typeof decrypted === "string") {
//     rawData = JSON.parse(decrypted);
//   } else {
//     rawData = decrypted;
//   }

//   if (!rawData || !rawData.programmName) {
//     return showToast("Something went wrong, please try again later.");
//   }


// // 4. تعقيم البيانات
// fixedData = {
//   companyName: DOMPurify.sanitize(rawData.companyName),
//   programmName: DOMPurify.sanitize(rawData.programmName),
//   merchantMSISDN: DOMPurify.sanitize(rawData.merchantMSISDN),
//   code: DOMPurify.sanitize(rawData.code),
//   amount: DOMPurify.sanitize(rawData.amount),
//   transactionID: DOMPurify.sanitize(rawData.transactionID),
// };
// otpPageID = DOMPurify.sanitize(rawData.otpPageID);

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

// document.getElementById("merchantInfo").innerHTML =
//   `<strong>Merchant:</strong> ${fixedData.programmName}`;

// document.getElementById("amountInfo").innerHTML =
//   `<strong>Total Amount:</strong> ${Number(fixedData.amount).toLocaleString()} SP`;


//   try{

//     // تشفير البيانات وإرسال طلب token
//   const tokenPayload = {
//       companyName: fixedData.companyName,
//       programmName: fixedData.programmName,
//       merchantMSISDN: fixedData.merchantMSISDN,
//       code: fixedData.code
//     };

//     const encryptedToken = await encryptHybrid(JSON.stringify({
//       ...tokenPayload,
//       pageID: publicID
//     }), serverPublicKey);

//     const tokenRes = await axios.post(`${baseURL}/api/clients/get-token`, {
//       ...encryptedToken,
//       pageID: publicID
//     }, { withCredentials: true}
//     );

//     const result = await decryptHybrid(tokenRes.data, rsaKeyPair.privateKey);
//     // document.cookie = `token=${result.token}; path=/; SameSite=Lax`;
//     sessionStorage.setItem("token", result.token);


//   } catch (error) {
//     if (error.response?.data?.encryptedAESKey) {
//       // إذا الخطأ مشفّر
//       const decryptedError = await decryptHybrid(error.response.data, rsaKeyPair.privateKey);
//       const errMsg = decryptedError.message || decryptedError.errorDesc || "Unknown encrypted error";
//       console.log(DOMPurify.sanitize(errMsg), "error");
//       showToast("something went wrong, try again later.")
//     } else {
//       console.log(DOMPurify.sanitize(error));
//     }
// }
//   // معالجة الفورم
//   document.getElementById("paymentForm").addEventListener("submit", async (e) => {
//     setLoadingState(true); 
//     e.preventDefault();

//     const customerMSISDN = DOMPurify.sanitize(document.getElementById("customerMSISDN").value.trim());
//     const confirmCustomerMSISDN = DOMPurify.sanitize(document.getElementById("confirmCustomerMSISDN").value.trim());

//     if (!customerMSISDN || !confirmCustomerMSISDN) {
//       setLoadingState(false); 
//       return showToast("All fields are required.");
//     }

//     if (customerMSISDN !== confirmCustomerMSISDN) {
//       setLoadingState(false); 
//       return showToast("Phone numbers do not match.");
//     }

//     const phoneRegex = /^0?9\d{8}$/;
//     if (!phoneRegex.test(customerMSISDN)) {
//       setLoadingState(false); 
//       return showToast("Invalid phone number. It must start with 09.");
//     }

//     // const token = document.cookie.split("; ").find(row => row.startsWith("token="))?.split("=")[1];

//     const token = sessionStorage.getItem("token");

    

//     try {
    
//       const paymentRequestPayload = {
//         code: fixedData.code,
//         customerMSISDN,
//         merchantMSISDN: fixedData.merchantMSISDN,
//         amount: fixedData.amount,
//         transactionID: fixedData.transactionID,
//         token
//       };

//       const encryptedpaymentRequestPayload = await encryptHybrid(JSON.stringify({
//         ...paymentRequestPayload,
//         pageID: publicID // ✅ أضف pageID داخل البيانات المشفرة
//       }), serverPublicKey);

//       const response = await axios.post(`${baseURL}/api/clients/payment-request`, {
//         ...encryptedpaymentRequestPayload,
//         pageID: publicID // ✅ أضف pageID أيضًا خارج التشفير
//       }, {
//         withCredentials: true
//       });

//       const result = await decryptHybrid(response.data, rsaKeyPair.privateKey);

//       if (result.errorCode === 0) {
//         setLoadingState(false); 
//         showToast("Verification code sent successfully ✅", "success");
//         setTimeout(() => {
//           window.location.href = `${baseURL}/api/clients/otpVerification-page/${otpPageID}`;
//         }, 3000);
//       } else {
//         showToast(result.message || "Something went wrong.");
//       }
//     } catch (error) {
//       setLoadingState(false); 
//     if (error.response?.data?.encryptedAESKey) {
//       // إذا الخطأ مشفّر
//       const decryptedError = await decryptHybrid(error.response.data, rsaKeyPair.privateKey);
//       const errMsg = decryptedError.message || decryptedError.errorDesc || "Unknown encrypted error";
//       console.log(DOMPurify.sanitize(errMsg), "error");

//       if (error.response.status === 404) {
//         const errorMessage = DOMPurify.sanitize(errMsg); // الرسالة المفكوكة
//         showToast(errorMessage);
//         return;
//       }

//       else {
//             showToast("something went wrong, try again later.");
//       }


//     } else {
//       console.log(DOMPurify.sanitize(error));
//       showToast("something went wrong, try again later.");
//     }
// }
//   });

// }catch(error){
//   console.log(error);
// }finally{
//   setPageLoadingState(false); // أظهر الشيمر أول ما تبدأ
// }
// }

// window.onload = sendData;

const _0x21d0d3=_0x5b46;(function(_0x2a8ad5,_0x4d64cf){const _0x1233a3=_0x5b46,_0x41d43f=_0x2a8ad5();while(!![]){try{const _0xfe2391=-parseInt(_0x1233a3(0x15f))/0x1+-parseInt(_0x1233a3(0x195))/0x2*(-parseInt(_0x1233a3(0x156))/0x3)+parseInt(_0x1233a3(0x15b))/0x4+-parseInt(_0x1233a3(0x190))/0x5*(-parseInt(_0x1233a3(0x17d))/0x6)+-parseInt(_0x1233a3(0x193))/0x7+parseInt(_0x1233a3(0x192))/0x8*(-parseInt(_0x1233a3(0x177))/0x9)+parseInt(_0x1233a3(0x151))/0xa;if(_0xfe2391===_0x4d64cf)break;else _0x41d43f['push'](_0x41d43f['shift']());}catch(_0x4cce50){_0x41d43f['push'](_0x41d43f['shift']());}}}(_0x24c3,0xd51c7));function setPageLoadingState(_0x5abf16){const _0x5298f5=_0x5b46,_0x916a89=document[_0x5298f5(0x164)](_0x5298f5(0x175)),_0x3a8416=document[_0x5298f5(0x164)]('phonePage');_0x916a89[_0x5298f5(0x18f)][_0x5298f5(0x14f)]=_0x5abf16?'flex':_0x5298f5(0x17c),_0x3a8416['style'][_0x5298f5(0x14f)]=_0x5abf16?_0x5298f5(0x17c):_0x5298f5(0x15e);}function setLoadingState(_0x1f6d30){const _0x19b168=_0x5b46,_0x298f18=document[_0x19b168(0x164)]('submitButton'),_0x25092b=document['getElementById']('buttonSpinner'),_0x2b39b1=document[_0x19b168(0x164)](_0x19b168(0x16b));_0x298f18[_0x19b168(0x157)]=_0x1f6d30,_0x25092b[_0x19b168(0x18f)][_0x19b168(0x14f)]=_0x1f6d30?_0x19b168(0x16d):_0x19b168(0x17c),_0x2b39b1[_0x19b168(0x18e)]=_0x1f6d30?'':_0x19b168(0x166);}function _0x24c3(){const _0x27c4e7=['amountInfo','amount','https://payment-package-ocht.onrender.com','log','textContent','style','2174815quSRtu','customerMSISDN','308888OMLMLO','782201NNnlIt','something\x20went\x20wrong,\x20try\x20again\x20later.','5370SHxQWo','Phone\x20numbers\x20do\x20not\x20match.','split','code','display','merchantMSISDN','7555090yLMNpo','companyName','addEventListener','encryptedAESKey','parse','918BibqFv','disabled','paymentForm','errorDesc','/api/clients/exchange-keys','2061536NtfTAe','\x20SP','/api/clients/otpVerification-page/','flex','742231bToRXa','message','Something\x20went\x20wrong.','setItem','href','getElementById','pathname','Next','transactionID','onload','sanitize','<strong>Merchant:</strong>\x20','buttonContent','error','inline-block','privateKey','/api/clients/payment-request','confirmCustomerMSISDN','preventDefault','serverPublicKey','publicKey','location','loadingSpinner','post','288sgvOAC','trim','/api/clients/get-token','data','Unknown\x20encrypted\x20error','none','12kwwnMo','Something\x20went\x20wrong,\x20please\x20try\x20again\x20later.','token','success','otpPageID','merchantInfo','stringify','response','programmName','status','innerHTML','<strong>Total\x20Amount:</strong>\x20','All\x20fields\x20are\x20required.'];_0x24c3=function(){return _0x27c4e7;};return _0x24c3();}function _0x5b46(_0x29ac6a,_0xd4547c){const _0x24c308=_0x24c3();return _0x5b46=function(_0x5b467d,_0x43e0c5){_0x5b467d=_0x5b467d-0x14e;let _0x3f0a7e=_0x24c308[_0x5b467d];return _0x3f0a7e;},_0x5b46(_0x29ac6a,_0xd4547c);}const baseURL=_0x21d0d3(0x18c);async function sendData(){const _0x263d4a=_0x21d0d3;setPageLoadingState(!![]);const _0x459c1d=window['location'][_0x263d4a(0x165)][_0x263d4a(0x197)]('/'),_0x12db45=_0x459c1d[_0x459c1d['length']-0x1];try{try{rsaKeyPair=await generateRSAKeyPair();const _0x42f1fa=await exportPublicKey(rsaKeyPair[_0x263d4a(0x173)]),_0x541df1=await axios['post'](baseURL+_0x263d4a(0x15a),{'clientPublicKey':_0x42f1fa,'phonePageID':_0x12db45},{'withCredentials':!![]});serverPublicKey=await importServerPublicKey(_0x541df1[_0x263d4a(0x17a)][_0x263d4a(0x172)]);}catch(_0x4d1ab3){console['log'](_0x4d1ab3);}try{const _0x4acf64={'pageID':_0x12db45},_0x220067=await axios[_0x263d4a(0x176)](baseURL+'/api/clients/payment-data',_0x4acf64,{'withCredentials':!![]}),_0x1dd6c9=await decryptHybrid(_0x220067[_0x263d4a(0x17a)],rsaKeyPair[_0x263d4a(0x16e)]);let _0x2ee0a4;typeof _0x1dd6c9==='string'?_0x2ee0a4=JSON[_0x263d4a(0x155)](_0x1dd6c9):_0x2ee0a4=_0x1dd6c9;if(!_0x2ee0a4||!_0x2ee0a4['programmName'])return showToast(_0x263d4a(0x17e));fixedData={'companyName':DOMPurify[_0x263d4a(0x169)](_0x2ee0a4[_0x263d4a(0x152)]),'programmName':DOMPurify[_0x263d4a(0x169)](_0x2ee0a4[_0x263d4a(0x185)]),'merchantMSISDN':DOMPurify['sanitize'](_0x2ee0a4[_0x263d4a(0x150)]),'code':DOMPurify[_0x263d4a(0x169)](_0x2ee0a4['code']),'amount':DOMPurify[_0x263d4a(0x169)](_0x2ee0a4['amount']),'transactionID':DOMPurify[_0x263d4a(0x169)](_0x2ee0a4[_0x263d4a(0x167)])},otpPageID=DOMPurify[_0x263d4a(0x169)](_0x2ee0a4[_0x263d4a(0x181)]);}catch(_0x48a8df){if(_0x48a8df['response']?.['data']?.['encryptedAESKey']){const _0x5ee632=await decryptHybrid(_0x48a8df['response']['data'],rsaKeyPair['privateKey']),_0x201f21=_0x5ee632[_0x263d4a(0x160)]||_0x5ee632[_0x263d4a(0x159)]||'Unknown\x20encrypted\x20error';console['log'](DOMPurify[_0x263d4a(0x169)](_0x201f21),_0x263d4a(0x16c)),console[_0x263d4a(0x18d)](_0x5ee632);}else console[_0x263d4a(0x18d)](DOMPurify[_0x263d4a(0x169)](_0x48a8df));}document[_0x263d4a(0x164)](_0x263d4a(0x182))[_0x263d4a(0x187)]=_0x263d4a(0x16a)+fixedData[_0x263d4a(0x185)],document[_0x263d4a(0x164)](_0x263d4a(0x18a))[_0x263d4a(0x187)]=_0x263d4a(0x188)+Number(fixedData[_0x263d4a(0x18b)])['toLocaleString']()+_0x263d4a(0x15c);try{const _0x36ba0e={'companyName':fixedData[_0x263d4a(0x152)],'programmName':fixedData[_0x263d4a(0x185)],'merchantMSISDN':fixedData['merchantMSISDN'],'code':fixedData[_0x263d4a(0x14e)]},_0xa29445=await encryptHybrid(JSON[_0x263d4a(0x183)]({..._0x36ba0e,'pageID':_0x12db45}),serverPublicKey),_0x45772b=await axios['post'](baseURL+_0x263d4a(0x179),{..._0xa29445,'pageID':_0x12db45},{'withCredentials':!![]}),_0x24c674=await decryptHybrid(_0x45772b['data'],rsaKeyPair[_0x263d4a(0x16e)]);sessionStorage[_0x263d4a(0x162)](_0x263d4a(0x17f),_0x24c674[_0x263d4a(0x17f)]);}catch(_0x10e4e8){if(_0x10e4e8['response']?.['data']?.[_0x263d4a(0x154)]){const _0x3df168=await decryptHybrid(_0x10e4e8[_0x263d4a(0x184)][_0x263d4a(0x17a)],rsaKeyPair[_0x263d4a(0x16e)]),_0x3d73e3=_0x3df168['message']||_0x3df168[_0x263d4a(0x159)]||_0x263d4a(0x17b);console[_0x263d4a(0x18d)](DOMPurify[_0x263d4a(0x169)](_0x3d73e3),_0x263d4a(0x16c)),showToast('something\x20went\x20wrong,\x20try\x20again\x20later.');}else console[_0x263d4a(0x18d)](DOMPurify['sanitize'](_0x10e4e8));}document[_0x263d4a(0x164)](_0x263d4a(0x158))[_0x263d4a(0x153)]('submit',async _0xabcd36=>{const _0x4604f3=_0x263d4a;setLoadingState(!![]),_0xabcd36[_0x4604f3(0x171)]();const _0x53d647=DOMPurify['sanitize'](document[_0x4604f3(0x164)](_0x4604f3(0x191))['value'][_0x4604f3(0x178)]()),_0x21d1fc=DOMPurify[_0x4604f3(0x169)](document[_0x4604f3(0x164)](_0x4604f3(0x170))['value'][_0x4604f3(0x178)]());if(!_0x53d647||!_0x21d1fc)return setLoadingState(![]),showToast(_0x4604f3(0x189));if(_0x53d647!==_0x21d1fc)return setLoadingState(![]),showToast(_0x4604f3(0x196));const _0x428e7a=/^0?9\d{8}$/;if(!_0x428e7a['test'](_0x53d647))return setLoadingState(![]),showToast('Invalid\x20phone\x20number.\x20It\x20must\x20start\x20with\x2009.');const _0x5b1771=sessionStorage['getItem'](_0x4604f3(0x17f));try{const _0x4b07bd={'code':fixedData['code'],'customerMSISDN':_0x53d647,'merchantMSISDN':fixedData[_0x4604f3(0x150)],'amount':fixedData[_0x4604f3(0x18b)],'transactionID':fixedData['transactionID'],'token':_0x5b1771},_0xfa9dde=await encryptHybrid(JSON['stringify']({..._0x4b07bd,'pageID':_0x12db45}),serverPublicKey),_0x396513=await axios[_0x4604f3(0x176)](baseURL+_0x4604f3(0x16f),{..._0xfa9dde,'pageID':_0x12db45},{'withCredentials':!![]}),_0x37660d=await decryptHybrid(_0x396513[_0x4604f3(0x17a)],rsaKeyPair['privateKey']);_0x37660d['errorCode']===0x0?(setLoadingState(![]),showToast('Verification\x20code\x20sent\x20successfully\x20✅',_0x4604f3(0x180)),setTimeout(()=>{const _0x3a5faa=_0x4604f3;window[_0x3a5faa(0x174)][_0x3a5faa(0x163)]=baseURL+_0x3a5faa(0x15d)+otpPageID;},0xbb8)):showToast(_0x37660d[_0x4604f3(0x160)]||_0x4604f3(0x161));}catch(_0x4f455f){setLoadingState(![]);if(_0x4f455f[_0x4604f3(0x184)]?.[_0x4604f3(0x17a)]?.[_0x4604f3(0x154)]){const _0x52f565=await decryptHybrid(_0x4f455f['response'][_0x4604f3(0x17a)],rsaKeyPair[_0x4604f3(0x16e)]),_0x48b103=_0x52f565[_0x4604f3(0x160)]||_0x52f565['errorDesc']||_0x4604f3(0x17b);console[_0x4604f3(0x18d)](DOMPurify['sanitize'](_0x48b103),_0x4604f3(0x16c));if(_0x4f455f[_0x4604f3(0x184)][_0x4604f3(0x186)]===0x194){const _0x3c0a06=DOMPurify[_0x4604f3(0x169)](_0x48b103);showToast(_0x3c0a06);return;}else showToast(_0x4604f3(0x194));}else console[_0x4604f3(0x18d)](DOMPurify[_0x4604f3(0x169)](_0x4f455f)),showToast(_0x4604f3(0x194));}});}catch(_0x40b8b8){console['log'](_0x40b8b8);}finally{setPageLoadingState(![]);}}window[_0x21d0d3(0x168)]=sendData;