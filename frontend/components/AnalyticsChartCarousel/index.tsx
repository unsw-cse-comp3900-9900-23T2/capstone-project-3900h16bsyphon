import Carousel from 'react-material-ui-carousel';
import styles from './AnalyticsChartCarousel.module.css';
import AnalyticsBarChart from '../AnalyticsBarChart';
import { AnalyticsWaitTimeData, TagAnalytics } from '../../types/courses';
import AnalyticsPieChart from '../AnalyticsPieChart';
import AnalyticsLineGraph from '../AnalyticsLineGraph';
import { DateRange } from 'react-day-picker';
import { Dayjs } from 'dayjs';

type AnalyticsChartCarouselProps = {
  waitTimeAnalytics?: AnalyticsWaitTimeData;
  tagAnalytics?: TagAnalytics;
  range: DateRange | undefined;
  startTime: Dayjs,
  endTime: Dayjs
};

// add more props here for other charts 
const AnalyticsChartCarousel = ({ waitTimeAnalytics, tagAnalytics, range, startTime, endTime }: AnalyticsChartCarouselProps ) => {
  return (
    <Carousel
      navButtonsProps={{
        style: {
          backgroundColor: '#3E368F',
          borderRadius: 100,
        },
      }}
      autoPlay={false}
    >
      <div className={styles.analyticsChartContainer}>
        <AnalyticsBarChart
          data={{
            labels: waitTimeAnalytics?.waitTimes.map(
              (x) => x.fullName
            ),
            datasets: [
              {
                label: 'mins',
                data: waitTimeAnalytics
                  ? waitTimeAnalytics.waitTimes.map((x) => x.averageWait)
                  : [],
                backgroundColor: '#D5CFFF', // doesn't let me use global css vars here
              },
            ],
          }}
          chartTitle={'Average Tutor Wait Times'}
        />
      </div>
      <div className={styles.analyticsChartContainer}>
        <AnalyticsPieChart 
          data={{
            labels: tagAnalytics?.sort((a, b) => a.name.localeCompare(b.name)).map((tag) => tag.name),
            datasets: [
              {
                label: '# of requests',
                data: tagAnalytics
                  ? tagAnalytics.map((tag) => tag.requestIds.length)
                  : 0,
                backgroundColor: [
                  '#BCD1F4',
                  '#D3D3D3',
                  '#B6EDB8',
                  '#F4BC4D',
                  '#D5CFFF',
                  '#EDB6B6',
                  '#EDB392',
                  '#6F7CB2',
                  '#B9490A'
                ]
              }
            ]
          }}
          chartTitle={'Course tag distribution'}
        />
      </div>
      <div className={styles.analyticsChartContainer}>
        <AnalyticsLineGraph range={range} startTime={startTime} endTime={endTime}/>
      </div>
    </Carousel>
  );
};

export default AnalyticsChartCarousel;
