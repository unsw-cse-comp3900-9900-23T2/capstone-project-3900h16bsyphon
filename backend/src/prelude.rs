//! This file contains all the prelude imports for the project.
//! Helps in keeping `main.rs` clean.

/// Instantiates `env_logger` with the appropriate settings based on the environment.
/// Otherwise uses the defaults based on the build type (debug / release).
pub fn startup_logger() {
    let (default_filter, default_write) = match in_release_build() {
        true => ("info", "always"),
        false => ("debug", "always"),
    };

    let env = env_logger::Env::default()
        .filter_or("MY_LOG", default_filter)
        .write_style_or("MY_LOG_STYLE", default_write);

    env_logger::init_from_env(env);

    log::trace!(
        "This is a trace log. If you are running a release build, this should NOT be visible by default."
    );
    log::debug!("This is a debug log. This should only be visible in debug builds.");
    log::info!("This is an info log. If you are in a release build, you should see [INFO] [WARN] and [ERROR] logs only.");
    log::warn!("This is a warning log. This should be visible in all builds.");
    log::error!("This is an error log. If you see this, something has gone horribly wrong.");

    log::info!("");
    log::info!("");
    log::info!("");
    log::info!("Logger set up successfully!");
}

#[cfg(debug_assertions)]
#[inline(always)]
pub const fn in_release_build() -> bool {
    false
}

#[cfg(not(debug_assertions))]
#[inline(always)]
pub const fn in_release_build() -> bool {
    true
}
