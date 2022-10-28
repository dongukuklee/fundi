const getLocalDate = () => {
  const date = new Date();
  date.setHours(date.getHours());
  return date;
};

const getFormatDate = (date: Date) => {
  let year = date.getFullYear();
  let month: string | number = date.getMonth() + 1;
  month = month >= 10 ? month.toString() : "0" + month;
  let day: string | number = date.getDate();
  day = day >= 10 ? day : "0" + day;
  return year + month + day;
};

const getCreateDateFormat = () => {
  return {
    createdAt: getLocalDate(),
    updatedAt: getLocalDate(),
  };
};
export { getLocalDate, getFormatDate, getCreateDateFormat };
