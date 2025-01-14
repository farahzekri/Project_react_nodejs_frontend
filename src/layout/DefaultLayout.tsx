import { useState, ReactNode } from 'react';
import * as React from 'react';
import Header from '../components/Header/index';
import Footer from '../components/Footer';
import ChatbotComponent from '../components/ChatBot/ChatbotComponent';


const DefaultLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (

        <div className="dark:bg-boxdark-2 dark:text-bodydark min-h-screen flex flex-col">

            <div className="flex-1">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <main className="flex-1">
                    <div className="mx-auto max-w-screen-2xl p-2 md:p-3 2xl:p-6">
                        {children}
                        {/* Include the ChatbotComponent */}
                        <ChatbotComponent />
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default DefaultLayout;
