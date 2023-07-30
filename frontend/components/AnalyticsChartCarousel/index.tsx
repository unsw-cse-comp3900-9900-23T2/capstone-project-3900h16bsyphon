import Carousel from 'react-material-ui-carousel';
import styles from './AnalyticsChartCarousel.module.css';
import AnalyticsBarChart from '../AnalyticsBarChart';
import { AnalyticsWaitTimeData, TagAnalytics } from '../../types/courses';
import AnalyticsPieChart from '../AnalyticsPieChart';

type AnalyticsChartCarouselProps = {
  waitTimeAnalytics?: AnalyticsWaitTimeData;
  tagAnalytics?: TagAnalytics;
};

// add more props here for other charts 
const AnalyticsChartCarousel = ({ waitTimeAnalytics, tagAnalytics }: AnalyticsChartCarouselProps ) => {
  return <>
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
            labels: tagAnalytics?.map((tag) => tag.name),
            datasets: [
              {
                label: '# of requests',
                data: tagAnalytics
                  ? tagAnalytics.map((tag) => tag.requestIds.length)
                  : 0,
                backgroundColor: [
                  'rgba(75, 192, 192, 0.2)',
                  'rgba(153, 102, 255, 0.1)',
                  'rgba(255, 159, 70, 0.5)',
                  'rgba(255, 159, 64, 0.3)',
                ]
              }
            ]
          }}
          chartTitle={'Queue tag distribution'}
        />
      </div>
    </Carousel>
  </>;
};

export default AnalyticsChartCarousel;
