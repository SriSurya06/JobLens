// import React, { useState } from 'react';
// import Sidebar from './Sidebar';

// export default function Layout({ children }) {
//   const [collapsed, setCollapsed] = useState(false);

//   return (
//     <>
//       <div className="mobile-not-supported">
//         Not visible in this mode
//         <br />
//         Please use screen width above 360px
//       </div>

//       <div className="app-shell">
//         <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

//         <main className="app-content">
//           <div className="app-page">
//             {children}
//           </div>
//         </main>
//       </div>
//     </>
//   );
// }

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* ================= DESKTOP ================= */}
      <div className="desktop-layout">

        <Header />

        <main className="desktop-content">
          <div className="app-page">
            {children}
          </div>
        </main>

      </div>


      {/* ================= SMALL SCREEN ================= */}
      <div className="mobile-layout">

        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />

        <main className="mobile-content">
          <div className="app-page">
            {children}
          </div>
        </main>

      </div>
    </>
  );
}