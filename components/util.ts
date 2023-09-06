export const trimAddress = (address: string, amount: number = 3) => {
  if (!address) {
    return "";
  }
  return `${address.slice(0, amount)}...${address.slice(-amount)}`;
};
