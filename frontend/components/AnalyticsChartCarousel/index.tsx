import Carousel from 'react-material-ui-carousel';
import styles from './AnalyticsChartCarousel.module.css';
import AnalyticsBarChart from '../AnalyticsBarChart';
import { AnalyticsWaitTimeData, ConsultationAnalytics, TagAnalytics } from '../../types/courses';
import AnalyticsPieChart from '../AnalyticsPieChart';
import AnalyticsLineGraph from '../AnalyticsLineGraph';
import { Dayjs } from 'dayjs';

type AnalyticsChartCarouselProps = {
  waitTimeAnalytics?: AnalyticsWaitTimeData;
  tagAnalytics?: TagAnalytics;
  startTime: Dayjs | null,
  endTime: Dayjs | null;
  consultationAnalytics?: ConsultationAnalytics;
};

// add more props here for other charts 
const AnalyticsChartCarousel = ({ waitTimeAnalytics, tagAnalytics, startTime, endTime, consultationAnalytics }: AnalyticsChartCarouselProps ) => {
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
        <AnalyticsLineGraph startTime={startTime} endTime={endTime} consultationAnalytics={consultationAnalytics} />
      </div>
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
    </Carousel>
  );
};

export default AnalyticsChartCarousel;
