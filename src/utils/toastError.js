export const getErrorMessage = (err) => {
  // AntD Form.validateFields() fail hone pe ye shape aata hai — already inline dikh raha hai form mein
  if (err?.errorFields) return null;

  if (typeof err === "string") return err;

  return err?.message || "Something went wrong. Please try again.";
};