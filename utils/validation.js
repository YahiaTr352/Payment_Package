const validatePhoneNumber = (phoneNumber) => {
  return phoneRegex.test(phoneNumber) && !isNaN(phoneNumber);
};

const isValidString = (val) => {
  if (typeof val !== 'string' || val.trim() === '') {
    return false;
  }
  
  const lowerVal = val.toLowerCase();

  if (lowerVal.includes('<script') || lowerVal.includes('</script')) {
    return false;
  }

  const hasHTMLTags = /<\/?[a-z][\s\S]*>/i.test(val);
  if (hasHTMLTags) {
    return false;
  }

  return true;
};

const isValidNumber = (val) => !isNaN(Number(val));

const isValidAmount = (value) => {
  const regex = /^(?!0*(\.0{1,2})?$)\d+(\.\d{1,2})?$/;
  return regex.test(value);
};


const phoneRegex = /^0?9\d{8}$/;

const validateCustomerPhoneNumber = (phoneNumber) => {
  return phoneRegex.test(phoneNumber) && !isNaN(phoneNumber);
};

const validateMerchantPhoneNumber = (phoneNumber) => {
    const phoneRegex = /^\+[1-9]\d{7,14}$/;
    return phoneRegex.test(phoneNumber);
}

const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
        return { valid: true, decoded };
    } catch (error) {
        return { valid: false, error };
    }
};

const isValidOTP = (otp) => {
  if (typeof otp !== 'string' || otp.trim() === '') {
    return false;
  }

  const trimmedOTP = otp.trim();

  const lowerVal = trimmedOTP.toLowerCase();
  const hasScript = lowerVal.includes('<script') || lowerVal.includes('</script');
  const hasHTMLTags = /<\/?[a-z][\s\S]*>/i.test(trimmedOTP);

  if (hasScript || hasHTMLTags) {
    return false;
  }

  return /^\d{6}$/.test(trimmedOTP);
};


module.exports = {
  validatePhoneNumber,
  isValidString,
  isValidNumber,
  isValidAmount,
  validateCustomerPhoneNumber,
  validateMerchantPhoneNumber,
  verifyToken,
  isValidOTP
};