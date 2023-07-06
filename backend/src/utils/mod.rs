pub mod auth;
pub mod db;
pub mod user;


// #[async_trait] pub trait AsyncCollect<T>: Iterator + Sized where T: Send,
//     Self::Item: std::future::Future<Output = T> ,
// {
//     async fn collect_await(self) -> Vec<T>;
// }
// 
// 
// #[async_trait]
// impl <It, F, T> AsyncCollect<T> for It
// where
//     It: Iterator<Item = F> + Send + Sized,
//     F: std::future::Future<Output = T> + Send,
//     T: Send,
//     It::Item: std::future::Future<Output = T> ,
// {
//     async fn collect_await(self) -> Vec<T> {
//         let mut vec = Vec::new();
//         while let Some(fut) = self.next() {
//             vec.push(fut.await);
//         }
//         vec
//         // vec![]
//     }
// }
