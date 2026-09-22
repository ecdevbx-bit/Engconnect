'use client';

export default function UiChrome() {
  return (
    <>
      {/* Custom Cursor */}
      <div id="cur"></div>
      <div id="cur-trail"></div>

      {/* Toast Container */}
      <div className="toast">
        <div className="toast-b" id="t-b"></div>
      </div>
    </>
  );
}