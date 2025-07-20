
const generateReactCode = async (req, res) => {
  const {
    companyname,
    programname,
    code,
    merchantmsisdn,
    amount,
  } = req.headers;

  if (!companyname || !programname || !code || !merchantmsisdn || !amount) {
    return res.status(400).json({
      error: "Missing required headers: companyname, programname, code, merchantmsisdn, amount",
    });
  }

  const backendCode = `


app.get("your route", async (req, res) => {
  const payload = {
   companyName: "${companyname}",
   programmName: "${programname}",
   code: "${code}",
   merchantMSISDN: "${merchantmsisdn}",
   amount: "${amount}",
  };

  try {
    const response = await axios.post(
      "https://payment-package-edit.onrender.com/api/clients/get-url",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "x-dev-request": "true",
        },
      }
    );

    const { url } = response.data;
    res.json({ url });
  } catch (error) {
    console.error("Error generating payment URL:", error.message);
    res.status(500).json({ error: "Failed to generate payment URL" });
  }
});
`

  const frontCode = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>MTN Cash Payment</title>
  <style>
    body, html {
      margin: 0;
      height: 100%;
      font-family: sans-serif;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    #error {
      color: red;
      padding: 20px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div id="error"></div>

  <script>
    async function loadIframe() {
      try {
        const res = await fetch("your route");
        const data = await res.json();

        if (data.url) {
          const iframe = document.createElement("iframe");
          iframe.src = data.url;
          iframe.sandbox = "allow-scripts allow-forms allow-same-origin allow-popups";
          document.body.appendChild(iframe);
        } else {
          document.getElementById("error").textContent = "No URL returned.";
        }
      } catch (err) {
        console.error("Error:", err);
        document.getElementById("error").textContent = "Failed to load payment.";
      }
    }

    loadIframe();
  </script>
</body>
</html>

`
  res.setHeader("Content-Type", "text/plain");
  res.send('/////backend//////\n'+backendCode+'/////frontend////\n'+frontCode);
  
}


// const generateFlutterCode = async (req, res) => {
//   const {
//     companyname,
//     programname,
//     code,
//     merchantmsisdn,
//     amount,
//   } = req.headers;

//   if (!companyname || !programname || !code || !merchantmsisdn || !amount) {
//     return res.status(400).json({
//       error: "Missing required headers: companyname, programname, code, merchantmsisdn, amount",
//     });
//   }

//   const reactCode = `
// import 'package:flutter/material.dart';
// import 'package:flutter/cupertino.dart';
// import 'package:webview_flutter/webview_flutter.dart';
// import 'package:http/http.dart' as http;
// import 'dart:convert';

// enum StatusRequest { none, loading, success, failure, offlinefailure, serverfailure }

// class SyriatelPayment extends StatefulWidget {
//   const SyriatelPayment({super.key});

//   @override
//   State<SyriatelPayment> createState() => _SyriatelPaymentState();
// }

// class _SyriatelPaymentState extends State<SyriatelPayment> {
//   WebViewController? _controller;
//   bool _isLoading = true;
//   bool _paymentHandled = false;

//   StatusRequest statusRequest = StatusRequest.none;
//   Map<String, dynamic>? data;


//   @override
//   void initState() {
//     super.initState();
//     WidgetsBinding.instance.addPostFrameCallback((_) async {
//       await requestSyriatel(context);
//       if (statusRequest == StatusRequest.success && data?['checkoutUrl'] != null) {
//         _initPayment();
//       }
//     });
//   }

//   Future<void> requestSyriatel(BuildContext context) async {
//     setState(() => statusRequest = StatusRequest.loading);
//     try {
//       final response = await http.post(
//         Uri.parse("https://payment-package-ocht.onrender.com/api/clients/get-url"),
//         headers: {
//           'Content-Type': 'application/json',
//           'x-dev-request': 'true',
//         },
//         body: jsonEncode({
//           companyName: "${companyname}",
//           programmName: "${programname}",
//           code: "${code}",
//           merchantMSISDN: "${merchantmsisdn}",
//           amount: "${amount}",
//         }),
//       ).timeout(const Duration(minutes: 5));

//       if (response.statusCode == 200) {
//         final decoded = jsonDecode(response.body);
//         if (decoded['error'] == 'This payment is already requested or not pending.') {
//           setState(() => statusRequest = StatusRequest.failure);
//           ScaffoldMessenger.of(context).showSnackBar(
//             const SnackBar(content: Text("هذه الدفعة تم طلبها بالفعل أو ليست بانتظار المعالجة")),
//           );
//         } else {
//           setState(() {
//             data = decoded;
//             statusRequest = StatusRequest.success;
//           });
//         }
//       } else {
//         setState(() => statusRequest = StatusRequest.serverfailure);
//         ScaffoldMessenger.of(context).showSnackBar(
//           const SnackBar(content: Text("فشل في الاتصال بالخادم")),
//         );
//       }
//     } catch (e) {
//       setState(() => statusRequest = StatusRequest.offlinefailure);
//       ScaffoldMessenger.of(context).showSnackBar(
//         const SnackBar(content: Text("التحقق من الاتصال بالإنترنت")),
//       );
//     }
//   }

//   void _initPayment() {
//     final controller = WebViewController()
//       ..setJavaScriptMode(JavaScriptMode.unrestricted)
//       ..setNavigationDelegate(
//         NavigationDelegate(
//           onPageStarted: (url) => setState(() => _isLoading = true),
//           onPageFinished: (url) => setState(() => _isLoading = false),
//           onNavigationRequest: (request) {
//             return NavigationDecision.navigate;
//           },
//         ),
//       )
//       ..loadRequest(Uri.parse(data!['checkoutUrl']));

//     setState(() => _controller = controller);
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       backgroundColor: Colors.white,
//       appBar: AppBar(
//         title: const Text("Syriatel Payment", style: TextStyle(color: Colors.red)),
//         backgroundColor: Colors.white,
//         leading: IconButton(
//           icon: const Icon(Icons.arrow_back_ios_new_outlined, color: Colors.red),
//           onPressed: () => Navigator.of(context).pop(),
//         ),
//       ),
//       body: Builder(builder: (context) {
//         if (statusRequest == StatusRequest.failure) {
//           return const Center(child: Text("فشل في الطلب", style: TextStyle(color: Colors.red)));
//         } else if (_controller == null) {
//           return const Center(child: CircularProgressIndicator(color: Colors.red));
//         } else {
//           return Stack(
//             children: [
//               WebViewWidget(controller: _controller!),
//               if (_isLoading)
//                 const Center(child: CircularProgressIndicator(color: Colors.red)),
//             ],
//           );
//         }
//       }),
//     );
//   }
// }
// `;

//   res.setHeader("Content-Type", "text/plain");
//   res.send(reactCode);
// }

const generateFlutterCode = async (req, res) => {
  const {
    companyname,
    programname,
    code,
    merchantmsisdn,
    amount,
  } = req.headers;

  if (!companyname || !programname || !code || !merchantmsisdn || !amount) {
    return res.status(400).json({
      error: "Missing required headers: companyname, programname, code, merchantmsisdn, amount",
    });
  }

  const backendCode = `


app.get("your route", async (req, res) => {
  const payload = {
   companyName: "${companyname}",
   programmName: "${programname}",
   code: "${code}",
   merchantMSISDN: "${merchantmsisdn}",
   amount: "${amount}",
  };

  try {
    const response = await axios.post(
      "https://payment-package-edit.onrender.com/api/clients/get-url",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "x-dev-request": "true",
        },
      }
    );

    const { url } = response.data;
    res.json({ url });
  } catch (error) {
    console.error("Error generating payment URL:", error.message);
    res.status(500).json({ error: "Failed to generate payment URL" });
  }
});
`

  const frontCode = `
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class SyriatelPayment extends StatefulWidget {
  const SyriatelPayment({super.key});

  @override
  State<SyriatelPayment> createState() => _SyriatelPaymentState();
}

class _SyriatelPaymentState extends State<SyriatelPayment> {
  WebViewController? _controller;
  bool _isLoading = true;
  String? paymentUrl;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await fetchPaymentUrl();
      if (paymentUrl != null) {
        _initWebView();
      }
    });
  }

  Future<void> fetchPaymentUrl() async {
    try {
      final res = await http.get(Uri.parse("you route"));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() => paymentUrl = data['url']);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("حدث خطأ أثناء جلب الرابط")),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("فشل الاتصال بالسيرفر")),
      );
    }
  }

  void _initWebView() {
    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadRequest(Uri.parse(paymentUrl!))
      ..setNavigationDelegate(NavigationDelegate(
        onPageStarted: (_) => setState(() => _isLoading = true),
        onPageFinished: (_) => setState(() => _isLoading = false),
      ));

    setState(() => _controller = controller);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("الدفع عبر سيريتل")),
      body: _controller == null
          ? const Center(child: CircularProgressIndicator())
          : Stack(
              children: [
                WebViewWidget(controller: _controller!),
                if (_isLoading) const Center(child: CircularProgressIndicator()),
              ],
            ),
    );
  }
}

`
  res.setHeader("Content-Type", "text/plain");
  res.send('/////backend//////\n'+backendCode+'/////frontend////\n'+frontCode);
  
}

module.exports = {
  generateReactCode,
  generateFlutterCode,
};