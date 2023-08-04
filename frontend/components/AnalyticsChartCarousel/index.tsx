import Carousel from 'react-material-ui-carousel';
import styles from './AnalyticsChartCarousel.module.css';
import AnalyticsBarChart from '../AnalyticsBarChart';
import { AnalyticsWaitTimeData, TagAnalytics } from '../../types/courses';
import AnalyticsLineGraph from '../AnalyticsLineGraph';

type AnalyticsChartCarouselProps = {
  waitTimeAnalytics?: AnalyticsWaitTimeData;
  tagAnalytics?: TagAnalytics;
  courseId: string | string[] | undefined;
};

// add more props here for other charts 
const AnalyticsChartCarousel = ({ waitTimeAnalytics, tagAnalytics, courseId }: AnalyticsChartCarouselProps ) => {
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
        <AnalyticsBarChart
          data={{
            labels: tagAnalytics?.sort((a, b) => a.name.localeCompare(b.name)).map((tag) => tag.name),
            datasets: [
              {
                label: '# of requests',
                data: tagAnalytics
                  ? tagAnalytics.map((tag) => tag.requestIds.length)
                  : [],
                backgroundColor: '#BCD1F4',
              }
            ],
          }}
          chartTitle={'Course tag distribution'}
        />
      </div>
      <div className={styles.analyticsChartContainer}>
        <AnalyticsLineGraph courseId={courseId}/>
      </div>
    </Carousel>
  );
};

export default AnalyticsChartCarousel;
