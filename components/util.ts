export const trimAddress = (address: string, amount: number = 3) => {
  if (!address) {
    return "";
  }
  return `${address.slice(0, amount)}...${address.slice(-amount)}`;
};

export const titleCase = (s: string) =>
  s &&
  s.replace(/^_*(.)|_+(.)/g, (_, c, d) =>
    c ? c.toUpperCase() : " " + d.toUpperCase()
  );
