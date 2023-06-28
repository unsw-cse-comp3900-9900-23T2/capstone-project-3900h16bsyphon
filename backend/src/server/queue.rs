#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateQueueBody {
    queue_id: String,
    start_time: String,
    end_time: String,
    is_visible: Boolean,
    is_available: Boolean,
    time_limit: String,
    announcement: String,
    course_offering_id: String
}

