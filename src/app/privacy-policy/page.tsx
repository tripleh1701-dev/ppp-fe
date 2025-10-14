'use client';

import {useState, useEffect} from 'react';
import {
    Shield,
    Lock,
    Globe,
    Database,
    FileText,
    AlertCircle,
    CheckCircle,
    Mail,
    ChevronDown,
    ChevronUp,
    Sparkles,
} from 'lucide-react';

export default function PrivacyPolicyPage() {
    const [expandedSections, setExpandedSections] = useState<{
        [key: string]: boolean;
    }>({
        scope: true,
    });
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const toggleSection = (section: string) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    return (
        <div className='h-full overflow-auto bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100'>
            <div
                className={`max-w-6xl mx-auto p-6 transition-all duration-1000 ${
                    isVisible
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-10'
                }`}
            >
                {/* Hero Section */}
                <div className='bg-gradient-to-r from-[#0171EC] via-[#0589EC] to-[#05E9FE] rounded-2xl shadow-2xl p-8 mb-6 relative overflow-hidden animate-gradient'>
                    <div className='absolute inset-0 bg-grid-white/10 animate-pulse-slow'></div>
                    <div className='absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-float'></div>
                    <div className='absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl animate-float-delayed'></div>
                    <div className='relative z-10'>
                        <div className='flex items-center gap-3 mb-4 animate-slide-in-left'>
                            <div className='p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg hover:scale-110 transition-transform duration-300 hover:rotate-6'>
                                <Shield className='w-8 h-8 text-white animate-pulse' />
                            </div>
                            <div>
                                <h1 className='text-4xl font-bold text-white mb-2 drop-shadow-lg'>
                                    Privacy Policy
                                </h1>
                                <p className='text-white/90 text-lg flex items-center gap-2'>
                                    <Sparkles className='w-5 h-5 animate-spin-slow' />
                                    Your data privacy is our top priority
                                </p>
                            </div>
                        </div>
                        <div className='flex items-center gap-4 mt-6 animate-slide-in-right'>
                            <div className='px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white/30 hover:shadow-xl transition-all duration-300 hover:scale-105'>
                                <p className='text-white text-sm font-medium'>
                                    Last Updated: February 29, 2024
                                </p>
                            </div>
                            <button className='px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/35 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group'>
                                <p className='text-white text-sm font-medium group-hover:translate-x-1 transition-transform'>
                                    View Version History →
                                </p>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Reference Table */}
                <div className='bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-xl border-2 border-blue-200 p-6 mb-6 transform hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl animate-fade-in-up'>
                    <h2 className='text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0171EC] to-[#05E9FE] mb-4 flex items-center gap-2'>
                        <CheckCircle className='w-6 h-6 text-[#0171EC] animate-bounce-slow' />
                        Quick Reference – How to Exercise Your Rights
                    </h2>
                    <div className='overflow-x-auto'>
                        <table className='w-full'>
                            <thead className='bg-gradient-to-r from-blue-100 to-cyan-100'>
                                <tr>
                                    <th className='px-6 py-3 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-300'>
                                        Rights
                                    </th>
                                    <th className='px-6 py-3 text-left text-sm font-semibold text-blue-900 border-b-2 border-blue-300'>
                                        Links
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    {
                                        right: 'Right to Know, Delete, Correct, Portability',
                                        link: 'Privacy Request Center',
                                    },
                                    {
                                        right: 'Opt Out of Selling/Sharing',
                                        link: 'Sell Share Opt-Out',
                                    },
                                    {
                                        right: 'Opt Out of Email Marketing',
                                        link: 'Unsubscribe',
                                    },
                                    {
                                        right: 'Opt Out of Platform Analytics',
                                        link: 'Analytics Opt-Out',
                                    },
                                ].map((item, index) => (
                                    <tr
                                        key={index}
                                        className='hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-300 group'
                                        style={{
                                            animation: `fadeInRow 0.5s ease-out ${
                                                index * 0.1
                                            }s backwards`,
                                        }}
                                    >
                                        <td className='px-6 py-4 text-sm text-slate-700 border-b border-blue-100 group-hover:text-blue-900 transition-colors'>
                                            {item.right}
                                        </td>
                                        <td className='px-6 py-4 text-sm border-b border-blue-100'>
                                            <button className='text-[#0171EC] hover:text-[#05E9FE] font-medium hover:underline transform hover:translate-x-2 transition-all duration-300 flex items-center gap-1'>
                                                {item.link}
                                                <span className='opacity-0 group-hover:opacity-100 transition-opacity'>
                                                    →
                                                </span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Main Content Sections */}
                <div className='space-y-4'>
                    {/* Scope Section */}
                    <Section
                        title='Scope'
                        icon={<FileText className='w-6 h-6' />}
                        expanded={expandedSections.scope}
                        onToggle={() => toggleSection('scope')}
                        color='blue'
                    >
                        <p className='text-slate-700 mb-4 leading-relaxed'>
                            Systiva Inc. (&quot;Systiva,&quot; &quot;We,&quot;
                            &quot;Our,&quot; &quot;Us&quot;) is dedicated to
                            protecting the privacy of its customers, business
                            partners, event attendees, job applicants, and
                            website visitors. This Systiva Privacy Statement
                            (&quot;Privacy Statement&quot;) reflects our global
                            privacy practices and standards as of the last
                            updated date and the preceding 12 months. It
                            explains how we collect, use, process, store, host,
                            transfer, and disclose information about you when
                            you interact directly with Systiva or our websites,
                            including but not limited to Systiva.io and its
                            subdomains (e.g., public-facing sites and support
                            site), other websites or applications owned and
                            controlled by Systiva (collectively, the
                            &quot;Website&quot;), along with our subsidiaries,
                            products, and services that link to this Privacy
                            Statement (collectively, the &quot;Service&quot;).
                        </p>
                        <div className='bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg'>
                            <p className='text-slate-700 leading-relaxed'>
                                This Privacy Statement applies to Systiva as the
                                Data Controller of customers&apos; information
                                relating to an identified or identifiable
                                individual (&quot;Personal Data&quot;). It does
                                NOT apply when Systiva acts as a Data Processor.
                                Our Service is not intended for children, and we
                                do not knowingly collect Personal Data from
                                minors.
                            </p>
                        </div>
                    </Section>

                    {/* Data Controller Section */}
                    <Section
                        title='Systiva as the Data Controller'
                        icon={<Shield className='w-6 h-6' />}
                        expanded={expandedSections.controller}
                        onToggle={() => toggleSection('controller')}
                        color='green'
                    >
                        <p className='text-slate-700 leading-relaxed'>
                            Systiva acts as the Data Controller of your Personal
                            Data as described in this Privacy Statement, unless
                            otherwise noted. As the Data Controller, Systiva is
                            responsible for and controls the processing of your
                            personal information collected through our Service.
                        </p>
                    </Section>

                    {/* Data Processor Section */}
                    <Section
                        title='Systiva as the Data Processor'
                        icon={<Database className='w-6 h-6' />}
                        expanded={expandedSections.processor}
                        onToggle={() => toggleSection('processor')}
                        color='purple'
                    >
                        <p className='text-slate-700 leading-relaxed'>
                            Systiva may also act as a Data Processor on behalf
                            of our customers. In such cases, we process
                            information according to agreements with those
                            customers, who remain the Data Controllers. Please
                            note, Systiva is not responsible for the privacy or
                            security practices of our customers, which may
                            differ from this Privacy Statement. To understand
                            how your Personal Data is handled by your employer
                            or another customer of Systiva, or to exercise your
                            privacy rights related to data provided by them,
                            please contact that entity directly.
                        </p>
                    </Section>

                    {/* Information We Collect */}
                    <Section
                        title='Information We Collect'
                        icon={<Database className='w-6 h-6' />}
                        expanded={expandedSections.collect}
                        onToggle={() => toggleSection('collect')}
                        color='indigo'
                    >
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            {[
                                {
                                    title: 'Contact Information and Identifiers',
                                    items: [
                                        'Name, email, mailing address, phone number',
                                    ],
                                },
                                {
                                    title: 'Professional and Business Data',
                                    items: [
                                        'Employer, job title, certifications, business contact details, industry',
                                    ],
                                },
                                {
                                    title: 'Online Identifiers',
                                    items: [
                                        'IP address, location data, usernames, social media profiles, device OS, browser type',
                                    ],
                                },
                                {
                                    title: 'Marketing, Sales, Training and Demo Info',
                                    items: [
                                        'Interests in products/services, calendar info, audio/video recordings',
                                    ],
                                },
                                {
                                    title: 'Account, Customer, and Financial Data',
                                    items: [
                                        'Account IDs, authentication credentials, products used, payment and billing details',
                                    ],
                                },
                                {
                                    title: 'Support and Communication Data',
                                    items: [
                                        'Emails, chat logs, service tickets',
                                    ],
                                },
                                {
                                    title: 'Employment Application Data',
                                    items: [
                                        'Resume, work history, education, salary, background checks',
                                    ],
                                },
                                {
                                    title: 'Analytics and Log Data',
                                    items: [
                                        'Feature usage, time on pages, visits',
                                    ],
                                },
                            ].map((category, index) => (
                                <div
                                    key={index}
                                    className='p-4 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-lg hover:shadow-md transition-all duration-200'
                                >
                                    <h4 className='font-semibold text-slate-900 mb-2'>
                                        {category.title}
                                    </h4>
                                    <ul className='text-sm text-slate-600 space-y-1'>
                                        {category.items.map((item, idx) => (
                                            <li
                                                key={idx}
                                                className='flex items-start gap-2'
                                            >
                                                <span className='text-green-500 mt-0.5'>
                                                    •
                                                </span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* How We Collect */}
                    <Section
                        title='How We Collect Information'
                        icon={<Globe className='w-6 h-6' />}
                        expanded={expandedSections.howCollect}
                        onToggle={() => toggleSection('howCollect')}
                        color='teal'
                    >
                        <div className='space-y-4'>
                            {[
                                {
                                    title: 'Provided By You',
                                    desc: 'When you sign up, communicate with us, provide feedback, attend events or trainings, visit our offices, or apply for a job',
                                    color: 'blue',
                                },
                                {
                                    title: 'Provided By Third Parties',
                                    desc: 'From event sponsors, employment referrals, open-source projects, info aggregators, partners, or in acquisitions',
                                    color: 'green',
                                },
                                {
                                    title: 'Automatically Collected',
                                    desc: 'Via cookies and beacons when you visit our websites or use our products and services',
                                    color: 'purple',
                                },
                            ].map((method, index) => (
                                <div
                                    key={index}
                                    className={`p-4 bg-${method.color}-50 border-l-4 border-${method.color}-500 rounded-r-lg hover:shadow-md transition-all duration-200`}
                                >
                                    <h4
                                        className={`font-semibold text-${method.color}-900 mb-2`}
                                    >
                                        {method.title}
                                    </h4>
                                    <p className='text-slate-700 text-sm'>
                                        {method.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Cookies & Beacons */}
                    <Section
                        title='Cookies & Beacons'
                        icon={<AlertCircle className='w-6 h-6' />}
                        expanded={expandedSections.cookies}
                        onToggle={() => toggleSection('cookies')}
                        color='amber'
                    >
                        <p className='text-slate-700 mb-4 leading-relaxed'>
                            Systiva uses cookies and beacons to enhance your
                            experience on our Website. Cookies are small files
                            stored on your device that may expire after your
                            session or persist until deleted. Types include:
                        </p>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                            {[
                                {
                                    type: 'Strictly Necessary Cookies',
                                    desc: 'Essential for website function and cannot be disabled',
                                },
                                {
                                    type: 'Functional Cookies',
                                    desc: 'Improve website performance and personalization',
                                },
                                {
                                    type: 'Performance Cookies',
                                    desc: 'Track visits and site traffic to improve our site',
                                },
                                {
                                    type: 'Targeting Cookies',
                                    desc: 'Help understand marketing efforts and target advertising',
                                },
                            ].map((cookie, index) => (
                                <div
                                    key={index}
                                    className='p-3 bg-amber-50 border border-amber-200 rounded-lg'
                                >
                                    <h5 className='font-semibold text-amber-900 mb-1 text-sm'>
                                        {cookie.type}
                                    </h5>
                                    <p className='text-slate-600 text-xs'>
                                        {cookie.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* How We Use Information */}
                    <Section
                        title='How We Use Collected Information'
                        icon={<Settings className='w-6 h-6' />}
                        expanded={expandedSections.use}
                        onToggle={() => toggleSection('use')}
                        color='blue'
                    >
                        <p className='text-slate-700 mb-4 leading-relaxed'>
                            We use Personal Data to support legitimate business
                            interests, comply with legal obligations, and
                            fulfill commercial purposes such as:
                        </p>
                        <ul className='space-y-2'>
                            {[
                                'Delivering requested products and services',
                                'Managing accounts and payments',
                                'Analyzing product usage and improving services',
                                'Providing customer support',
                                'Communicating important updates and marketing',
                                'Detecting and preventing fraud or misuse',
                                'Supporting recruitment and legal compliance',
                            ].map((item, index) => (
                                <li
                                    key={index}
                                    className='flex items-start gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors'
                                >
                                    <CheckCircle className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
                                    <span className='text-slate-700'>
                                        {item}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </Section>

                    {/* When We Share */}
                    <Section
                        title='When We Share Personal Information'
                        icon={<Globe className='w-6 h-6' />}
                        expanded={expandedSections.share}
                        onToggle={() => toggleSection('share')}
                        color='red'
                    >
                        <p className='text-slate-700 mb-4 leading-relaxed'>
                            We only share Personal Data when necessary to
                            deliver our services or comply with legal
                            obligations, including with:
                        </p>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                            {[
                                'Partners and subsidiaries',
                                'Service providers and vendors under contract',
                                'Legal and regulatory authorities',
                                'With your explicit consent',
                            ].map((item, index) => (
                                <div
                                    key={index}
                                    className='p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg'
                                >
                                    <p className='text-slate-700 text-sm'>
                                        {item}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className='mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                            <p className='text-sm text-slate-700'>
                                <strong>Note:</strong> Systiva does not sell
                                Personal Data for monetary gain but may disclose
                                it to third parties (e.g., subprocessors) to
                                deliver our services, which could be considered
                                a sale under some laws like CCPA.
                            </p>
                        </div>
                    </Section>

                    {/* Data Security */}
                    <Section
                        title='How We Secure Your Data'
                        icon={<Lock className='w-6 h-6' />}
                        expanded={expandedSections.security}
                        onToggle={() => toggleSection('security')}
                        color='green'
                    >
                        <div className='p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl'>
                            <div className='flex items-start gap-4'>
                                <div className='p-3 bg-green-100 rounded-lg'>
                                    <Lock className='w-8 h-8 text-green-600' />
                                </div>
                                <div>
                                    <h4 className='font-semibold text-green-900 mb-2'>
                                        Industry-Standard Security Measures
                                    </h4>
                                    <p className='text-slate-700 leading-relaxed'>
                                        Systiva prioritizes data protection and
                                        security, employing industry-standard
                                        measures and maintaining a comprehensive
                                        information security program to prevent
                                        unauthorized access or disclosure. More
                                        details are available at our Trust
                                        Center.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* Privacy Rights */}
                    <Section
                        title='Privacy Rights and Choices'
                        icon={<CheckCircle className='w-6 h-6' />}
                        expanded={expandedSections.rights}
                        onToggle={() => toggleSection('rights')}
                        color='purple'
                    >
                        <p className='text-slate-700 mb-4 leading-relaxed'>
                            You have various rights regarding your Personal
                            Data, including:
                        </p>
                        <div className='space-y-3'>
                            {[
                                {
                                    title: 'Right to Know',
                                    desc: 'Request disclosure of Personal Data we hold',
                                },
                                {
                                    title: 'Right to Delete',
                                    desc: 'Request deletion, with some exceptions for business or legal reasons',
                                },
                                {
                                    title: 'Right to Correct',
                                    desc: 'Request corrections to inaccurate data',
                                },
                                {
                                    title: 'Right to Portability',
                                    desc: 'Request your data in a machine-readable format',
                                },
                                {
                                    title: 'Right to Opt Out',
                                    desc: 'Of automated decision-making, selling/sharing, email marketing, interest-based ads, and analytics',
                                },
                                {
                                    title: 'Right to Non-Discrimination',
                                    desc: 'Protection from retaliation for exercising your rights',
                                },
                            ].map((right, index) => (
                                <div
                                    key={index}
                                    className='p-4 bg-purple-50 border border-purple-200 rounded-lg hover:shadow-md transition-all duration-200'
                                >
                                    <h5 className='font-semibold text-purple-900 mb-1'>
                                        {right.title}
                                    </h5>
                                    <p className='text-slate-600 text-sm'>
                                        {right.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Contact Information */}
                    <Section
                        title='Contact Information'
                        icon={<Mail className='w-6 h-6' />}
                        expanded={expandedSections.contact}
                        onToggle={() => toggleSection('contact')}
                        color='blue'
                    >
                        <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200'>
                            <p className='text-slate-700 mb-4 leading-relaxed'>
                                For questions or to exercise your rights, email{' '}
                                <a
                                    href='mailto:privacy@systiva.io'
                                    className='text-blue-600 hover:text-blue-700 font-medium hover:underline'
                                >
                                    privacy@systiva.io
                                </a>{' '}
                                or contact:
                            </p>
                            <div className='bg-white p-4 rounded-lg border border-blue-200'>
                                <p className='font-semibold text-slate-900'>
                                    Systiva, Inc.
                                </p>
                                <p className='text-slate-700'>
                                    Attn: Legal Department
                                </p>
                                <p className='text-slate-700'>
                                    55 Stockton Street, 8th Floor
                                </p>
                                <p className='text-slate-700'>
                                    San Francisco, CA 94108
                                </p>
                            </div>
                        </div>
                    </Section>
                </div>

                {/* Footer CTA */}
                <div className='mt-8 bg-gradient-to-r from-[#0171EC] via-[#0589EC] to-[#05E9FE] rounded-2xl shadow-2xl p-8 text-center relative overflow-hidden group animate-fade-in-up'>
                    <div className='absolute inset-0 bg-grid-white/10'></div>
                    <div className='absolute top-0 left-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700'></div>
                    <div className='relative z-10'>
                        <div className='flex items-center justify-center gap-2 mb-3'>
                            <Sparkles className='w-6 h-6 text-white animate-pulse' />
                            <h3 className='text-2xl font-bold text-white drop-shadow-lg'>
                                Questions About Your Privacy?
                            </h3>
                            <Sparkles className='w-6 h-6 text-white animate-pulse' />
                        </div>
                        <p className='text-white/95 mb-6 text-lg drop-shadow'>
                            We&apos;re here to help. Reach out to our privacy
                            team anytime.
                        </p>
                        <button className='px-8 py-4 bg-white text-[#0171EC] font-bold rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-2xl hover:shadow-white/50 hover:scale-110 group/btn'>
                            <span className='flex items-center gap-2'>
                                Contact Privacy Team
                                <Mail className='w-5 h-5 group-hover/btn:translate-x-1 transition-transform' />
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes fadeInRow {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes float {
                    0%,
                    100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-20px);
                    }
                }
                @keyframes floatDelayed {
                    0%,
                    100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-15px);
                    }
                }
                @keyframes slideInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes pulseSlow {
                    0%,
                    100% {
                        opacity: 0.3;
                    }
                    50% {
                        opacity: 0.6;
                    }
                }
                @keyframes gradient {
                    0% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                    100% {
                        background-position: 0% 50%;
                    }
                }
                @keyframes bounceSlow {
                    0%,
                    100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-5px);
                    }
                }
                @keyframes spinSlow {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
                .bg-grid-white\/10 {
                    background-image: linear-gradient(
                            rgba(255, 255, 255, 0.1) 1px,
                            transparent 1px
                        ),
                        linear-gradient(
                            90deg,
                            rgba(255, 255, 255, 0.1) 1px,
                            transparent 1px
                        );
                    background-size: 20px 20px;
                }
                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient 15s ease infinite;
                }
                .animate-pulse-slow {
                    animation: pulseSlow 4s ease-in-out infinite;
                }
                .animate-float {
                    animation: float 8s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: floatDelayed 10s ease-in-out infinite;
                }
                .animate-slide-in-left {
                    animation: slideInLeft 0.8s ease-out;
                }
                .animate-slide-in-right {
                    animation: slideInRight 0.8s ease-out;
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.8s ease-out;
                }
                .animate-bounce-slow {
                    animation: bounceSlow 2s ease-in-out infinite;
                }
                .animate-spin-slow {
                    animation: spinSlow 8s linear infinite;
                }
            `}</style>
        </div>
    );
}

interface SectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    expanded: boolean;
    onToggle: () => void;
    color: string;
}

function Section({
    title,
    icon,
    children,
    expanded,
    onToggle,
    color,
}: SectionProps) {
    const colorMap: {
        [key: string]: {
            bg: string;
            border: string;
            text: string;
            hover: string;
        };
    } = {
        blue: {
            bg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
            border: 'border-blue-300',
            text: 'text-[#0171EC]',
            hover: 'hover:from-blue-100 hover:to-cyan-100',
        },
        green: {
            bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
            border: 'border-green-300',
            text: 'text-green-700',
            hover: 'hover:from-green-100 hover:to-emerald-100',
        },
        purple: {
            bg: 'bg-gradient-to-r from-purple-50 to-indigo-50',
            border: 'border-purple-300',
            text: 'text-purple-700',
            hover: 'hover:from-purple-100 hover:to-indigo-100',
        },
        indigo: {
            bg: 'bg-gradient-to-r from-indigo-50 to-blue-50',
            border: 'border-indigo-300',
            text: 'text-indigo-700',
            hover: 'hover:from-indigo-100 hover:to-blue-100',
        },
        teal: {
            bg: 'bg-gradient-to-r from-teal-50 to-cyan-50',
            border: 'border-teal-300',
            text: 'text-teal-700',
            hover: 'hover:from-teal-100 hover:to-cyan-100',
        },
        amber: {
            bg: 'bg-gradient-to-r from-amber-50 to-orange-50',
            border: 'border-amber-300',
            text: 'text-amber-700',
            hover: 'hover:from-amber-100 hover:to-orange-100',
        },
        red: {
            bg: 'bg-gradient-to-r from-red-50 to-pink-50',
            border: 'border-red-300',
            text: 'text-red-700',
            hover: 'hover:from-red-100 hover:to-pink-100',
        },
    };

    const colors = colorMap[color] || colorMap.blue;

    return (
        <div className='bg-white rounded-xl shadow-xl border-2 border-blue-100 overflow-hidden transform hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl hover:border-blue-300'>
            <button
                onClick={onToggle}
                className={`w-full px-6 py-4 flex items-center justify-between ${colors.bg} ${colors.hover} transition-all duration-300 group`}
            >
                <div className='flex items-center gap-3'>
                    <div
                        className={`${colors.text} transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}
                    >
                        {icon}
                    </div>
                    <h2
                        className={`text-xl font-bold ${colors.text} group-hover:translate-x-1 transition-transform duration-300`}
                    >
                        {title}
                    </h2>
                </div>
                {expanded ? (
                    <ChevronUp
                        className={`w-5 h-5 ${colors.text} transform group-hover:translate-y-1 transition-transform`}
                    />
                ) : (
                    <ChevronDown
                        className={`w-5 h-5 ${colors.text} transform group-hover:translate-y-1 transition-transform`}
                    />
                )}
            </button>
            {expanded && (
                <div
                    className='px-6 py-6 bg-gradient-to-br from-white to-blue-50/30'
                    style={{animation: 'slideDown 0.4s ease-out'}}
                >
                    {children}
                </div>
            )}
        </div>
    );
}

// Placeholder Settings import
function Settings({className}: {className?: string}) {
    return (
        <svg
            className={className}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
        >
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
            />
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
            />
        </svg>
    );
}
