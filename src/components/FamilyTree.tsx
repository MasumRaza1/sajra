import { useState, useMemo, useEffect, useRef } from 'react';
import type { FamilyMember } from '../types/FamilyMember';
import { familyData } from '../utils/familyData';
import { findAncestors, findDescendants } from '../utils/familyUtils';
import { useTheme } from './ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';

type FilterType = 'all' | 'generation' | 'deceased';

// Helper function to determine relationship (male only)
const getRelationship = (generationDiff: number, isAncestor: boolean): string => {
  if (isAncestor) {
    switch (generationDiff) {
      case 1: return 'पिता/अब्बा (Father)';
      case 2: return 'दादा/बाबा (Grandfather)';
      case 3: return 'पड़दादा (Great Grandfather)';
      case 4: return 'परदादा (Great Great Grandfather)';
      case 5: return 'बड़े परदादा (Ancient Grandfather)';
      default: return `${Math.abs(generationDiff)} पीढ़ी के बुज़ुर्ग (${Math.abs(generationDiff)} Generation Elder)`;
    }
  } else {
    switch (generationDiff) {
      case 1: return 'बेटा (Son)';
      case 2: return 'पोता (Grandson)';
      case 3: return 'परपोता (Great Grandson)';
      case 4: return 'बड़े परपोता (Great Great Grandson)';
      case 5: return 'पांचवी पीढ़ी का पोता (5th Generation Grandson)';
      default: return `${Math.abs(generationDiff)} पीढ़ी के वंशज (${Math.abs(generationDiff)} Generation Descendant)`;
    }
  }
};

// Helper function to format Hijri date
const formatHijriDate = (day: number | string, month: string, year: number) => {
  return `${day} ${month} ${year}H`;
};

// Helper function to get accurate Hijri date
const getHijriDate = () => {
  const today = new Date();
  
  // Define known accurate date pairs (Gregorian to Hijri)
  const knownDates = [
    { 
      gregorian: new Date(2025, 5, 3), // June 3, 2025
      hijri: { day: 7, month: "Dhul Hijjah", year: 1446 }
    },
    { 
      gregorian: new Date(2025, 5, 7), // June 7, 2025
      hijri: { day: 10, month: "Dhul Hijjah", year: 1446 }
    },
    { 
      gregorian: new Date(2025, 6, 8), // July 8, 2025
      hijri: { day: 1, month: "Muharram", year: 1447 }
    }
  ];

  // Find the closest known date
  const closestDate = knownDates.reduce((prev, curr) => {
    const prevDiff = Math.abs(prev.gregorian.getTime() - today.getTime());
    const currDiff = Math.abs(curr.gregorian.getTime() - today.getTime());
    return prevDiff < currDiff ? prev : curr;
  });

  // Calculate the difference in days
  const diffDays = Math.floor((today.getTime() - closestDate.gregorian.getTime()) / (1000 * 60 * 60 * 24));

  // Hijri months array
  const hijriMonths = [
    "Muharram", "Safar", "Rabi ul Awwal", "Rabi us Sani",
    "Jumada al-Ula", "Jumada al-Thani", "Rajab", "Shaban",
    "Ramadan", "Shawwal", "Dhul Qadah", "Dhul Hijjah"
  ];

  // Calculate the current Hijri date based on the difference
  let { day, month, year } = closestDate.hijri;
  day += diffDays;

  // Adjust for month/year transitions (approximate)
  while (day > 30) {
    day -= 30;
    const monthIndex = hijriMonths.indexOf(month);
    if (monthIndex === hijriMonths.length - 1) {
      month = hijriMonths[0];
      year++;
    } else {
      month = hijriMonths[monthIndex + 1];
    }
  }
  while (day < 1) {
    const monthIndex = hijriMonths.indexOf(month);
    if (monthIndex === 0) {
      month = hijriMonths[hijriMonths.length - 1];
      year--;
    } else {
      month = hijriMonths[monthIndex - 1];
    }
    day += 30;
  }

  return { day, month, year };
};

// Helper function to format date range with better Hijri formatting
const formatDateRange = (gregorianStart: string, gregorianEnd: string, hijriDate: string) => {
  // Parse Hijri date components
  const [day, month, year] = hijriDate.split(' ');
  const formattedHijri = formatHijriDate(day, month, parseInt(year));
  
  return {
    gregorian: `${gregorianStart}${gregorianEnd ? ` - ${gregorianEnd}` : ''}`,
    hijri: formattedHijri
  };
};

// Update the specialDates array with better Hijri date formatting
const specialDates = [
  // Major Islamic Festivals (Moon dependent)
  { 
    date: formatDateRange("31 Mar 2025", "1 Apr 2025", "1 Shawwal 1446"),
    name: "Eid ul-Fitr",
    type: "eid",
    urdu: "عید الفطر",
    description: "Subject to moon sighting"
  },
  { 
    date: formatDateRange("7 Jun 2025", "8 Jun 2025", "10 Dhul Hijjah 1446"),
    name: "Eid ul-Adha",
    type: "eid",
    urdu: "عید الاضحی",
    description: "Subject to moon sighting"
  },
  { 
    date: formatDateRange("8 Jul 2025", "", "1 Muharram 1447"),
    name: "Islamic New Year",
    type: "eid",
    urdu: "نیا ہجری سال",
    description: "1447 Hijri"
  },

  // Important Islamic Dates
  { 
    date: formatDateRange("27 Jan 2025", "", "27 Rajab 1446"),
    name: "Shab-e-Meraj",
    type: "important",
    urdu: "شب معراج",
    description: "Night of Ascension"
  },
  { 
    date: formatDateRange("14 Feb 2025", "", "15 Shaban 1446"),
    name: "Shab-e-Barat",
    type: "important",
    urdu: "شب برات",
    description: "Night of Fortune"
  },
  { 
    date: formatDateRange("1 Mar 2025", "", "1 Ramadan 1446"),
    name: "Ramzan Start",
    type: "important",
    urdu: "آغاز رمضان",
    description: "Subject to moon sighting"
  },
  { 
    date: formatDateRange("27 Mar 2025", "", "27 Ramadan 1446"),
    name: "Shab-e-Qadr",
    type: "important",
    urdu: "شب قدر",
    description: "Night of Power"
  },
  { 
    date: formatDateRange("5 Sep 2025", "", "12 Rabi ul Awwal 1447"),
    name: "Eid Milad un Nabi ﷺ",
    type: "important",
    urdu: "عید میلاد النبی ﷺ",
    description: "Prophet's Birthday"
  },

  // Urs & Fatihiya Dates
  { 
    date: formatDateRange("14 Oct 2025", "", "11 Rabi us Sani 1447"),
    name: "Urs Aala Hazrat",
    type: "fatihiya",
    urdu: "عرس اعلی حضرت",
    description: "Imam Ahmad Raza Khan رحمۃ اللہ علیہ"
  },
  { 
    date: formatDateRange("7 Jan 2025", "", "6 Rajab 1446"),
    name: "Urs Huzoor Ghous Paak",
    type: "fatihiya",
    urdu: "عرس حضور غوث پاک",
    description: "Shaikh Abdul Qadir Jilani رحمۃ اللہ علیہ"
  },
  { 
    date: formatDateRange("23 Jul 2025", "", "17 Safar 1447"),
    name: "Urs Mujaddid Alfe Sani",
    type: "fatihiya",
    urdu: "عرس مجدد الف ثانی",
    description: "Sheikh Ahmad Sirhindi رحمۃ اللہ علیہ"
  },

  // Local Events
  { 
    date: formatDateRange("6 Nov 2025", "", "5 Jumada al-Ula 1447"),
    name: "Palamu Dargah Urs",
    type: "local",
    urdu: "عرس درگاہ پلامو",
    description: "Annual Urs"
  },
  { 
    date: formatDateRange("31 Jul 2025", "", "25 Safar 1447"),
    name: "Jharkhand Khanqahi Ijtema",
    type: "local",
    urdu: "اجتماع خانقاہی جھارکھنڈ",
    description: "Annual Gathering"
  },
];

// Helper function to parse date string to Date object
const parseDate = (dateStr: string) => {
  const [day, month, year] = dateStr.split(' ');
  const months = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  return new Date(parseInt(year), months[month as keyof typeof months], parseInt(day));
};

// Helper function to get days until event
const getDaysUntil = (dateStr: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = parseDate(dateStr.split('-')[0].trim()); // Use first date if range
  return Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

// Helper function to check if date is in range
const isUpcoming = (dateStr: string, daysThreshold = 30) => {
  const daysUntil = getDaysUntil(dateStr);
  return daysUntil >= 0 && daysUntil <= daysThreshold;
};

// Update the HijriCalendar component
const HijriCalendar = () => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Get current dates with proper initialization
  const currentHijriDate = useMemo(() => {
    return getHijriDate();
  }, []);

  // Format current Hijri date
  const formattedHijriDate = useMemo(() => {
    return formatHijriDate(
      currentHijriDate.day,
      currentHijriDate.month,
      currentHijriDate.year
    );
  }, [currentHijriDate]);

  // Get Indian date
  const indianDate = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    });
  }, []);

  // Debug log to check values
  useEffect(() => {
    console.log('Current Hijri Date:', currentHijriDate);
    console.log('Formatted Hijri Date:', formattedHijriDate);
  }, [currentHijriDate, formattedHijriDate]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sort and filter events
  const sortedEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return ['eid', 'important', 'fatihiya', 'local'].map(type => {
      const events = specialDates.filter(date => date.type === type);
      
      // Sort events: upcoming first, then by date
      const sortedEvents = events.sort((a, b) => {
        const aUpcoming = isUpcoming(a.date.gregorian);
        const bUpcoming = isUpcoming(b.date.gregorian);
        
        if (aUpcoming && !bUpcoming) return -1;
        if (!aUpcoming && bUpcoming) return 1;
        
        return getDaysUntil(a.date.gregorian) - getDaysUntil(b.date.gregorian);
      });

      return {
        type,
        title: type === 'eid' ? 'Major Festivals' :
               type === 'important' ? 'Important Dates' :
               type === 'fatihiya' ? 'Urs & Fatihiya' : 'Local Events',
        events: sortedEvents
      };
    });
  }, [specialDates]);

  return (
    <div className="relative" ref={modalRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
          theme === 'dark'
            ? 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700'
            : 'bg-white hover:bg-gray-50 border border-gray-200'
        }`}
      >
        <div className="flex flex-col items-start">
          <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
            {formattedHijriDate}
          </span>
          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {indianDate.split(',')[0]}
          </span>
        </div>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed inset-0 z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 ${
              theme === 'dark'
                ? 'bg-gray-900 sm:bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            } sm:w-96 sm:rounded-xl sm:border sm:shadow-lg`}
          >
            {/* Mobile Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            } sm:hidden`}>
              <h3 className={`text-lg font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Calendar</h3>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-2 rounded-full ${
                  theme === 'dark'
                    ? 'hover:bg-gray-800 text-gray-400'
                    : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Current Date Display */}
            <div className={`p-4 border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="space-y-1">
                <div className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {indianDate}
                </div>
                <div className={`text-lg font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {formattedHijriDate}
                </div>
              </div>
            </div>

            {/* Upcoming Events Section */}
            <div className="flex-1 overflow-y-auto max-h-[70vh] sm:max-h-[400px]">
              <div className="p-4 space-y-4">
                {sortedEvents.map(({ type, title, events }) => (
                  <div key={type} className="space-y-2">
                    <h4 className={`text-xs font-medium uppercase tracking-wider ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {title}
                    </h4>
                    <div className="space-y-2">
                      {events.map((date, index) => {
                        const daysUntil = getDaysUntil(date.date.gregorian);
                        const isNearby = isUpcoming(date.date.gregorian);
                        
                        return (
                          <div
                            key={index}
                            className={`p-3 rounded-lg transition-all duration-200 ${
                              theme === 'dark'
                                ? isNearby ? 'bg-gray-800/80 border border-gray-700' : 'bg-gray-800/50'
                                : isNearby ? 'bg-gray-50/90 border border-gray-200' : 'bg-gray-50/60'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {date.name}
                                  </span>
                                  {isNearby && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      theme === 'dark'
                                        ? 'bg-blue-500/20 text-blue-300'
                                        : 'bg-blue-50 text-blue-600'
                                    }`}>
                                      {daysUntil === 0 ? 'Today' :
                                       daysUntil === 1 ? 'Tomorrow' :
                                       `In ${daysUntil} days`}
                                    </span>
                                  )}
                                </div>
                                <div className={`mt-1 text-xs ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {date.date.gregorian}
                                </div>
                                <div className={`mt-0.5 text-xs ${
                                  theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                                }`}>
                                  {date.date.hijri}
                                </div>
                                {date.description && (
                                  <div className={`mt-0.5 text-xs italic ${
                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                                  }`}>
                                    {date.description}
                                  </div>
                                )}
                              </div>
                              <div className={`text-sm font-urdu text-right ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                {date.urdu}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function FamilyTree() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [generationLevel, setGenerationLevel] = useState<number>(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const eldersRef = useRef<HTMLDivElement>(null);
  const childrenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get all generations
  const generations = useMemo(() => {
    const genMap = new Map<number, FamilyMember[]>();
    const getGeneration = (member: FamilyMember): number => {
      let gen = 0;
      let current = member;
      while (current.fatherId) {
        gen++;
        const father = familyData.find(m => m.id === current.fatherId);
        if (!father) break;
        current = father;
      }
      return gen;
    };

    familyData.forEach(member => {
      const gen = getGeneration(member);
      if (!genMap.has(gen)) genMap.set(gen, []);
      genMap.get(gen)?.push(member);
    });
    return genMap;
  }, []);

  // Search suggestions
  const suggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    return familyData
      .filter(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        member.id !== selectedMember?.id
      )
      .slice(0, 5);
  }, [searchTerm, selectedMember]);
  // Filter members
  const filteredMembers = useMemo(() => {
    let filtered = familyData;
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterType === 'generation') {
      filtered = generations.get(generationLevel) || [];
    } else if (filterType === 'deceased') {
      filtered = familyData.filter(member => member.isDeceased);
    }
    return filtered;
  }, [searchTerm, filterType, generationLevel, generations]);

  const ancestors = selectedMember ? findAncestors(selectedMember) : [];
  const descendants = selectedMember ? findDescendants(selectedMember) : [];

  // Get deceased members
  const deceasedMembers = useMemo(() => {
    return familyData.filter(member => member.isDeceased);
  }, []);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100' : 'bg-gradient-to-b from-gray-50 to-white text-gray-900'}`}>
      <header className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled 
          ? theme === 'dark'
            ? 'bg-gray-900/95 backdrop-blur-lg shadow-lg shadow-gray-900/20'
            : 'bg-white/95 backdrop-blur-lg shadow-lg shadow-black/5'
          : ''
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-4">
          <div className="flex flex-col gap-2 sm:gap-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className={`text-xl sm:text-2xl font-bold ${
                  theme === 'dark' 
                    ? 'text-white bg-gradient-to-r from-blue-400 to-purple-400' 
                    : 'text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600'
                } bg-clip-text`}>
                  खानदान का शजरा
                </h1>
                <p className={`text-xs sm:text-sm mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Family Tree Explorer
                </p>
              </div>
              <div className="flex items-center gap-3">
                <HijriCalendar />
                <button
                  onClick={toggleTheme}
                  className={`p-2 sm:p-3 rounded-full transition-all duration-200 active:scale-95 ${
                    theme === 'dark'
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    theme === 'dark' ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'
                  }`}
                >
                  {theme === 'light' ? '🌙' : '☀️'}
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-2 sm:space-y-4">
              <div className="relative">
                <div className={`absolute inset-y-0 left-3 flex items-center pointer-events-none ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search family members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-gray-800/50 focus:bg-gray-800 text-white placeholder-gray-400'
                      : 'bg-gray-100/50 focus:bg-gray-100 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />

                {/* Search Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className={`absolute left-0 right-0 mt-1 py-2 rounded-xl shadow-lg z-50 max-h-60 overflow-auto ${
                    theme === 'dark'
                      ? 'bg-gray-800 border border-gray-700'
                      : 'bg-white border border-gray-200'
                  }`}>
                    {suggestions.map((suggestion) => {
                      const memberGen = Array.from(generations.keys()).find(gen =>
                        generations.get(gen)?.some(m => m.id === suggestion.id)
                      );

                      return (
                        <div
                          key={suggestion.id}
                          onClick={() => {
                            setSelectedMember(suggestion);
                            setSearchTerm('');
                            setShowSuggestions(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 cursor-pointer ${
                            theme === 'dark'
                              ? 'hover:bg-gray-700'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <span className={`text-sm ${
                            theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                          }`}>
                            {suggestion.name}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            theme === 'dark'
                              ? 'bg-gray-700 text-gray-300'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            पीढ़ी {memberGen}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="flex flex-wrap gap-2 sm:gap-3 flex-1 min-w-0">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as FilterType)}
                    className={`px-3 py-2 text-sm rounded-xl flex-1 transition-all duration-200 ${
                      theme === 'dark'
                        ? 'bg-gray-800/50 text-white border border-gray-700'
                        : 'bg-gray-100/50 text-gray-900 border border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="all">सभी सदस्य (All Members)</option>
                    <option value="generation">पीढ़ी के अनुसार (By Generation)</option>
                    <option value="deceased">मरहूम सदस्य (Deceased Members)</option>
                  </select>

                  {filterType === 'generation' && (
                    <select
                      value={generationLevel}
                      onChange={(e) => setGenerationLevel(Number(e.target.value))}
                      className={`px-3 py-2 text-sm rounded-xl w-32 transition-all duration-200 ${
                        theme === 'dark'
                          ? 'bg-gray-800/50 text-white border border-gray-700'
                          : 'bg-gray-100/50 text-gray-900 border border-gray-200'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      {Array.from(generations.keys()).map(gen => (
                        <option key={gen} value={gen}>पीढ़ी {gen}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className={`px-3 py-2 rounded-xl text-xs font-medium ${
                  theme === 'dark'
                    ? 'bg-gray-800/50 text-gray-300 border border-gray-700'
                    : 'bg-gray-100/50 text-gray-600 border border-gray-200'
                }`}>
                  {filterType === 'deceased' 
                    ? `${deceasedMembers.length} deceased members`
                    : `${filteredMembers.length} members`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {filterType === 'deceased' ? (
          <div className="space-y-4 px-2 sm:px-4 py-3 sm:py-6">
            {/* Isaal-e-Sawab Header - More compact */}
            <div className="text-center space-y-2">
              <div className={`mx-auto px-3 py-4 rounded-xl ${
                theme === 'dark' 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-white border border-gray-200'
              }`}>
                <h2 className={`text-xl sm:text-2xl font-bold ${
                  theme === 'dark' 
                    ? 'text-white' 
                    : 'text-gray-900'
                }`}>
                  ایصال ثواب
                </h2>
                <p className={`text-sm mt-1 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Remember our departed family members ({deceasedMembers.length})
                </p>
              </div>

              {/* Duas Section - With Accordion */}
              <div className={`mt-4 rounded-xl overflow-hidden ${
                theme === 'dark' 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-white border border-gray-200'
              }`}>
                {/* Bismillah */}
                <div className="text-center p-3 space-y-1.5 border-b border-gray-700">
                  <div className={`text-xl sm:text-2xl font-arabic ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                  </div>
                  <div className={`text-xs sm:text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Bismillah ir-Rahman ir-Raheem
                  </div>
                  <div className={`text-xs sm:text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    बिस्मिल्लाह अर-रहमान अर-रहीम
                  </div>
                </div>

                {/* Duas in Accordion */}
                <div className="divide-y divide-gray-700">
                  {/* Dua 1 */}
                  <details className="group">
                    <summary className={`flex items-center justify-between p-3 cursor-pointer ${
                      theme === 'dark' ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'
                    }`}>
                      <span className={`text-base font-medium ${
                        theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                        رَحِمَهُمُ ٱللَّٰهُ
                      </span>
                      <svg 
                        className={`w-4 h-4 transition-transform duration-200 group-open:rotate-180 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className={`p-3 space-y-1.5 text-sm ${
                      theme === 'dark' ? 'bg-gray-700/20' : 'bg-gray-50'
                    }`}>
                      <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        Rahimahumullah
                      </div>
                      <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        रहमहुमुल्लाह
                      </div>
                    </div>
                  </details>

                  {/* Dua 2 */}
                  <details className="group">
                    <summary className={`flex items-center justify-between p-3 cursor-pointer ${
                      theme === 'dark' ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'
                    }`}>
                      <span className={`text-base font-medium ${
                        theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                        اَللّٰهُمَّ اغْفِرْ لَهُمْ وَارْحَمْهُمْ
                      </span>
                      <svg 
                        className={`w-4 h-4 transition-transform duration-200 group-open:rotate-180 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className={`p-3 space-y-1.5 text-sm ${
                      theme === 'dark' ? 'bg-gray-700/20' : 'bg-gray-50'
                    }`}>
                      <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        Allahummaghfir lahum warhamhum
                      </div>
                      <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        अल्लाहुम्मगफिर लहुम वरहमहुम
                      </div>
                    </div>
                  </details>

                  {/* Dua 3 */}
                  <details className="group">
                    <summary className={`flex items-center justify-between p-3 cursor-pointer ${
                      theme === 'dark' ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'
                    }`}>
                      <span className={`text-base font-medium ${
                        theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                        اَللّٰهُمَّ نَوِّرْ قُبُورَهُمْ وَاجْعَلِ الْجَنَّةَ مَثْوَاهُمْ
                      </span>
                      <svg 
                        className={`w-4 h-4 transition-transform duration-200 group-open:rotate-180 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className={`p-3 space-y-1.5 text-sm ${
                      theme === 'dark' ? 'bg-gray-700/20' : 'bg-gray-50'
                    }`}>
                      <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        Allahumma nawwir quboorahum waj'alil jannata mathwahum
                      </div>
                      <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        अल्लाहुम्मा नव्विर क़ुबूरहुम वजअलिल जन्नता मथवाहुम
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>

            {/* Deceased Members List - More compact */}
            <div className="space-y-2">
              <h3 className={`text-sm font-medium uppercase tracking-wider px-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Deceased Members
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {deceasedMembers.map(member => {
                  const memberGen = Array.from(generations.keys()).find(gen =>
                    generations.get(gen)?.some(m => m.id === member.id)
                  );

                  return (
                    <div
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        theme === 'dark'
                          ? 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700'
                          : 'bg-white hover:bg-gray-50 border border-gray-200'
                      } active:scale-[0.98]`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm truncate ${
                          theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {member.name}
                        </div>
                        <div className={`text-xs mt-0.5 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Generation {memberGen}
                        </div>
                      </div>
                      <div className={`shrink-0 text-xs px-2 py-1 rounded-full ${
                        theme === 'dark'
                          ? 'bg-gray-700/50 text-gray-300'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        पीढ़ी {memberGen}
                      </div>
                    </div>
                  );
                })}
              </div>

              {deceasedMembers.length === 0 && (
                <div className={`text-center p-6 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-gray-800/50 text-gray-400 border border-gray-700'
                    : 'bg-gray-50 text-gray-600 border border-gray-200'
                }`}>
                  No deceased members recorded
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {filteredMembers.map(member => {
              const memberGen = Array.from(generations.keys()).find(gen =>
                generations.get(gen)?.some(m => m.id === member.id)
              );
              
              return (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setSelectedMember(member)}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 active:scale-98 ${
                    theme === 'dark'
                      ? 'bg-gray-800/50 hover:bg-gray-800'
                      : 'bg-white hover:bg-gray-50'
                  } ${
                    selectedMember?.id === member.id
                      ? 'ring-2 ring-blue-500'
                      : theme === 'dark'
                        ? 'border border-gray-700'
                        : 'border border-gray-200'
                  } hover:shadow-lg ${
                    theme === 'dark'
                      ? 'hover:shadow-black/20'
                      : 'hover:shadow-black/5'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm">
                        {member.name}
                      </div>
                    </div>
                    <div className={`shrink-0 text-xs px-2.5 py-1 rounded-full ${
                      theme === 'dark'
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      पीढ़ी {memberGen}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Add Isaal-e-Sawab button in footer */}
        <footer className={`mt-6 py-3 px-2 text-center border-t ${
          theme === 'dark' 
            ? 'border-gray-800' 
            : 'border-gray-100'
        }`}>
          <div className="text-[10px] space-y-1">
            <p className={`${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`}>
              Last updated: June 3, 2025
            </p>
            <p className={`${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Webapp by Masum Raza
            </p>
          </div>
        </footer>

        <AnimatePresence>
          {selectedMember && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedMember(null)}
                className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40"
              />

              <motion.div
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[85vh] sm:max-h-[90vh] ${
                  theme === 'dark'
                    ? 'bg-gray-900/95 border-t border-gray-800'
                    : 'bg-white/95 border-t border-gray-100'
                } backdrop-blur-lg shadow-xl ${
                  theme === 'dark'
                    ? 'shadow-black/30'
                    : 'shadow-black/10'
                } sm:max-w-2xl sm:mx-auto sm:mb-4 sm:rounded-2xl sm:border`}
              >
                {/* Fixed Header */}
                <div className={`sticky top-0 z-10 ${
                  theme === 'dark'
                    ? 'bg-gray-900/95'
                    : 'bg-white/95'
                } backdrop-blur-lg border-b ${
                  theme === 'dark' ? 'border-gray-800' : 'border-gray-100'
                }`}>
                  {/* Handle bar for mobile */}
                  <div className="flex justify-center sm:hidden">
                    <div className={`w-12 h-1 my-2 rounded-full ${
                      theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                    }`} />
                  </div>

                  {/* Member name and generation */}
                  <div className="px-4 pb-2.5 pt-1">
                    <div className="flex flex-col gap-2">
                      <div className="pr-8">
                        <h2 className={`text-lg font-bold leading-tight break-words ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {selectedMember.name}
                        </h2>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          theme === 'dark'
                            ? 'bg-indigo-500/10 text-indigo-200'
                            : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          पीढ़ी {Array.from(generations.keys()).find(gen =>
                            generations.get(gen)?.some(m => m.id === selectedMember.id)
                          )}
                        </span>

                        {/* Close button */}
                        <button
                          onClick={() => setSelectedMember(null)}
                          className={`p-1.5 rounded-full active:scale-95 ${
                            theme === 'dark'
                              ? 'bg-gray-800/50 text-gray-400 hover:text-gray-200'
                              : 'bg-gray-100/50 text-gray-500 hover:text-gray-700'
                          } transition-all duration-200`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                  {/* Count Cards */}
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Elders Count */}
                      <button
                        onClick={() => scrollToSection(eldersRef)}
                        className={`p-3 rounded-lg text-center transition-all duration-200 ${
                          theme === 'dark'
                            ? 'bg-gray-800/80 hover:bg-gray-800 active:scale-95'
                            : 'bg-gray-50 hover:bg-gray-100 active:scale-95'
                        } border ${
                          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`}
                      >
                        <div className={`text-2xl font-bold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {ancestors.length}
                        </div>
                        <div className={`text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          बुज़ुर्ग
                        </div>
                        <div className={`text-xs mt-0.5 ${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          Elders
                        </div>
                      </button>

                      {/* Children Count */}
                      <button
                        onClick={() => scrollToSection(childrenRef)}
                        className={`p-3 rounded-lg text-center transition-all duration-200 ${
                          theme === 'dark'
                            ? 'bg-gray-800/80 hover:bg-gray-800 active:scale-95'
                            : 'bg-gray-50 hover:bg-gray-100 active:scale-95'
                        } border ${
                          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`}
                      >
                        <div className={`text-2xl font-bold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {descendants.length}
                        </div>
                        <div className={`text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          बच्चे
                        </div>
                        <div className={`text-xs mt-0.5 ${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          Children
                        </div>
                      </button>
                    </div>

                    {/* Relationships List */}
                    <div className="space-y-3">
                      {/* Ancestors */}
                      <div ref={eldersRef}>
                        <div className={`text-xs font-medium uppercase tracking-wider mb-2.5 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          बुज़ुर्ग (Elders)
                        </div>
                        <div className="space-y-2">
                          {ancestors.length > 0 ? ancestors.map(ancestor => {
                            const ancestorGen = Array.from(generations.keys()).find(gen =>
                              generations.get(gen)?.some(m => m.id === ancestor.id)
                            );
                            const selectedGen = Array.from(generations.keys()).find(gen =>
                              generations.get(gen)?.some(m => m.id === selectedMember.id)
                            ) || 0;
                            const genDiff = (selectedGen) - (ancestorGen || 0);

                            return (
                              <div
                                key={ancestor.id}
                                onClick={() => setSelectedMember(ancestor)}
                                className={`flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-lg active:scale-98 ${
                                  theme === 'dark'
                                    ? 'bg-gray-800/80 hover:bg-gray-800 border border-gray-700'
                                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                } cursor-pointer transition-all duration-200`}
                              >
                                <span className={`font-medium text-sm leading-tight break-words ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {ancestor.name}
                                </span>
                                <span className={`shrink-0 self-start sm:self-auto text-xs px-2.5 py-1 rounded-full ${
                                  theme === 'dark'
                                    ? 'bg-gray-700 text-gray-300'
                                    : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {getRelationship(Math.abs(genDiff), true)}
                                </span>
                              </div>
                            );
                          }) : (
                            <div className={`text-sm p-2.5 rounded-lg ${
                              theme === 'dark'
                                ? 'bg-gray-800/80 text-gray-400 border border-gray-700'
                                : 'bg-gray-50 text-gray-500 border border-gray-200'
                            }`}>
                              कोई बुज़ुर्ग नहीं (No elders found)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Descendants */}
                      <div ref={childrenRef}>
                        <div className={`text-xs font-medium uppercase tracking-wider mb-2.5 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          बच्चे (Children)
                        </div>
                        <div className="space-y-2">
                          {descendants.length > 0 ? descendants.map(descendant => {
                            const descendantGen = Array.from(generations.keys()).find(gen =>
                              generations.get(gen)?.some(m => m.id === descendant.id)
                            );
                            const selectedGen = Array.from(generations.keys()).find(gen =>
                              generations.get(gen)?.some(m => m.id === selectedMember.id)
                            ) || 0;
                            const genDiff = (descendantGen || 0) - selectedGen;

                            return (
                              <div
                                key={descendant.id}
                                onClick={() => setSelectedMember(descendant)}
                                className={`flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-lg active:scale-98 ${
                                  theme === 'dark'
                                    ? 'bg-gray-800/80 hover:bg-gray-800 border border-gray-700'
                                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                } cursor-pointer transition-all duration-200`}
                              >
                                <span className={`font-medium text-sm leading-tight break-words ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {descendant.name}
                                </span>
                                <span className={`shrink-0 self-start sm:self-auto text-xs px-2.5 py-1 rounded-full ${
                                  theme === 'dark'
                                    ? 'bg-gray-700 text-gray-300'
                                    : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {getRelationship(Math.abs(genDiff), false)}
                                </span>
                              </div>
                            );
                          }) : (
                            <div className={`text-sm p-2.5 rounded-lg ${
                              theme === 'dark'
                                ? 'bg-gray-800/80 text-gray-400 border border-gray-700'
                                : 'bg-gray-50 text-gray-500 border border-gray-200'
                            }`}>
                              कोई बच्चे नहीं (No children found)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
} 