import moment from 'moment-timezone';

const months = [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]; // recent 1 year
// const months = [23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]; // recent 2 year

const getMonthEnd = (num) => moment().add( 0 - num, 'M').endOf('month');
// const getPreDay = (day) => day.subtract(10, "days").tz("Asia/Shanghai"); // timezone

const dayTime = months.map(item => getMonthEnd(item).toISOString());

const dayTimes = dayTime.map(item => {
    const momentItem = moment(item);
    const firstDay = moment(momentItem).startOf('month');
    const dataRange = {
        month: momentItem.format('YYYY-MM'),
        sinceTime: firstDay.format('YYYY-MM-DDTHH:mm:ssZ'),
        untilTime: momentItem.format('YYYY-MM-DDTHH:mm:ssZ'),
    }
    return dataRange;
});

export default dayTimes;