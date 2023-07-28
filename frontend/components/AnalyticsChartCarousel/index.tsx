import Carousel from 'react-material-ui-carousel';
import styles from './AnalyticsChartCarousel.module.css';
import AnalyticsBarChart from '../AnalyticsBarChart';
import AnalyticsChart from '../Chart';
import { AnalyticsWaitTimeData } from '../../types/courses';

type AnalyticsChartCarouselProps = {
  waitTimeAnalytics?: AnalyticsWaitTimeData;
};

// add more props here for other charts 
const AnalyticsChartCarousel = ({ waitTimeAnalytics }: AnalyticsChartCarouselProps ) => {
  return <>
    <Carousel
      navButtonsProps={{
        style: {
          backgroundColor: '#3E368F',
          borderRadius: 100,
        },
      }}
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
        <AnalyticsChart />
      </div>
      <div className={styles.analyticsChartContainer}>
        <AnalyticsChart />
      </div>
    </Carousel>
  </>;
};

export default AnalyticsChartCarousel;
