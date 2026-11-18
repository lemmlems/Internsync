export default function SignIn() {
  return (
    <div className="auth-screen min-h-screen" id="auth-screen" aria-live="polite">
      <div className="auth-panel auth-intro relative flex flex-col">
        <div className="auth-left-header flex items-center">
          <div className="auth-left-logo" aria-label="Quezon City University logo"><img src="/QCU_Logo.png" alt="QCU logo" /></div>
          <span>Quezon City University</span>
        </div>
        <div className="auth-left-content">
          <h1>Intern<span>Sync</span></h1>
          <p>Centralized system for monitoring student internship progress and compliance at QCU.</p>
        </div>
      </div>
      <div className="auth-panel auth-form-panel">
        <form id="login-form" className="auth-form active" noValidate>
          <div className="login-card-top">
            <h2>Sign In</h2>
            <div className="auth-crest-wrap"><div className="auth-crest"><img src="/InternSync_Logo.png" alt="InternSync emblem" /></div></div>
          </div>
          <div className="login-card-divider relative w-full overflow-hidden" aria-hidden="true">
            <img className="login-card-divider-art w-full" src="/Sidebar%20Art.svg" alt="" />
          </div>
          <div className="login-card-bottom">
            <div className="auth-field"><label htmlFor="login-email">Email Address</label><input id="login-email" name="email" type="email" placeholder="yourname@qcu.edu.ph" required /></div>
            <div className="auth-field"><label htmlFor="login-password">Password</label><input id="login-password" name="password" type="password" placeholder="Enter your password" required /></div>
            <p className="auth-switch-text">Don't have an account? <button type="button" className="link-button" data-auth-mode="signup">Sign Up</button></p>
            <button className="auth-submit-button" type="submit" disabled>Sign In</button>
            <div className="form-error" data-auth-error="login" role="alert"></div>
          </div>
        </form>
        <form id="signup-form" className="auth-form" noValidate>
          <h2>Sign Up</h2>
          <p className="signup-subtitle">Select your role, then enter your credentials.</p>
          <div className="role-selector" aria-label="Role selection">
            <button className="role-card active" type="button" data-role-option="student" aria-pressed="true">Student</button>
            <button className="role-card" type="button" data-role-option="adviser" aria-pressed="false">OJT Adviser / Dean</button>
            <button className="role-card" type="button" data-role-option="spards" aria-pressed="false">Admin</button>
          </div>
          <div className="student-id-box" id="student-id-box"><label htmlFor="signup-student-id">ID Number</label><input id="signup-student-id" name="studentNumber" type="text" placeholder="e.g. 23-1924" inputMode="numeric" autoComplete="off" maxLength={7} pattern="[0-9]{2}-[0-9]{4}" aria-describedby="student-id-hint" required /><span className="student-id-hint" id="student-id-hint">Enter 2 digits, then 4 digits.</span></div>
          <div className="student-academic-fields" id="student-academic-fields">
            <div className="auth-field catalog-field">
              <label htmlFor="signup-college">Department / College</label>
              <input id="signup-college" type="text" placeholder="Select Department / College" readOnly aria-haspopup="listbox" aria-expanded="false" aria-controls="college-options" data-catalog-dropdown="college" />
              <div id="college-options" className="catalog-options" role="listbox" aria-label="Department / College options" hidden />
            </div>
            <div className="auth-field catalog-field">
              <label htmlFor="signup-program">Program</label>
              <input id="signup-program" type="text" placeholder="Select a college first" readOnly aria-haspopup="listbox" aria-expanded="false" aria-controls="program-options" data-catalog-dropdown="program" disabled />
              <div id="program-options" className="catalog-options" role="listbox" aria-label="Program options" hidden />
            </div>
            <div className="auth-field">
              <label htmlFor="signup-year-level">Year Level</label>
              <input id="signup-year-level" name="yearLevel" type="text" placeholder="Selected automatically" disabled />
            </div>
          </div>
          <div className="auth-field"><label htmlFor="signup-name">Full Name</label><input id="signup-name" name="name" type="text" placeholder="Enter your last name" required /></div>
          <div className="auth-field"><label htmlFor="signup-email">Email Address</label><input id="signup-email" name="email" type="email" placeholder="yourname@qcu.edu.ph" required /></div>
          <div className="auth-field"><label htmlFor="signup-password">Password</label><input id="signup-password" name="password" type="password" placeholder="Enter your password" minLength={6} required /></div>
          <label className="terms-check"><input type="checkbox" name="terms" required /><span>By signing up, you agree to our <a href="#">Terms and Conditions</a> and <a href="#">Privacy Policy</a></span></label>
          <button className="auth-submit-button" type="submit" disabled>Sign Up</button>
          <p className="auth-switch-text">Already have an account? <button type="button" className="link-button" data-auth-mode="login">Sign In</button></p>
          <div className="form-error" data-auth-error="signup" role="alert"></div>
        </form>
      </div>
    </div>
  );
}
