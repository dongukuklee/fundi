export const getLocalDate = () => {
  const date = new Date();
  date.setHours(date.getHours() + 9);
  return date;
};
