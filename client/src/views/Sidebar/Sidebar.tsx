import { NavLink, useNavigate } from 'react-router';
import { clearTokens } from '../../utils/tokenApi';
import { useState } from 'react';

export const Sidebar = () => {
    const [activePage, setActivePage] = useState(location.pathname);
    const navigate = useNavigate()
    return <div className="nav-wrapper">
        <div className={'nav-helper' + (activePage == '/calendar' ? ' nav-helper-2' : '')}>
            
        </div>
        <nav className='nav'>
            <div className='nav-link-wrapper' onClick={() => setTimeout(() => setActivePage('/'), 250)}>
                <svg className='nav-mask'>
                    <defs>
                        <mask id="circle-mask">
                            <rect width="147" height="100vh" fill="white"/>
                            <circle cx="0" cy="170" r="90" className="nav-mask-circle"/>
                        </mask>
                    </defs>
                </svg>
                <NavLink to='/'>
                    <img src='/profileLogo.svg' />
                </NavLink>
            </div>
            <div className='nav-link-wrapper' onClick={() => setTimeout(() => setActivePage('/calendar'), 250)}>
                <svg className='nav-mask'>
                    <defs>
                        <mask id="circle-mask-2">
                            <rect width="150" height="100vh" fill="white"/>
                            <circle cx="0" cy="340" r="90" className="nav-mask-circle"/>
                        </mask>
                    </defs>
                </svg>
                <NavLink to='/calendar'>
                    <img src='/calendarLogo.svg' />
                </NavLink>
            </div>
        </nav>
        <button className='button button-exit' onClick={() => {
            clearTokens();
            navigate('/auth');
        }}>Выйти</button>
    </div>
}