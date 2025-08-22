import React, { useEffect, useMemo, useState } from "react";

import { useParams } from "react-router-dom";
import { fetchDepartmentById } from "../supabaseConfig/supabaseApi";
import Loader from "../Components/Loader";

const DepartmentDetail = () => {
  const { id } = useParams();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getDepartment = async () => {
      setLoading(true);
      try {
        const data = await fetchDepartmentById(id);
        // Parse courses data - handle both JSON and pipe-separated formats
        let courses = data.courses;
        if (courses && typeof courses === "string") {
          // Check if it's pipe-separated format (new format)
          if (courses.includes(" | ")) {
            const yearCourses = {};
            const years = courses.split(" | ");
            years.forEach(yearData => {
              const [yearInfo, courseList] = yearData.split(": ");
              if (yearInfo && courseList) {
                yearCourses[yearInfo.trim()] = courseList.split(", ").map(course => course.trim());
              }
            });
            courses = yearCourses;
          } else {
            // Try to parse as JSON (old format)
            try {
              courses = JSON.parse(courses);
            } catch (e) {
              courses = null;
            }
          }
        }
        setDepartment({ ...data, courses });
        setError(null);
      } catch (err) {
        setError("Department not found.");
        setDepartment(null);
      }
      setLoading(false);
    };
    getDepartment();
  }, [id]);

  const InfoCard = ({ icon, title, content, bgColor = "bg-white" }) => (
    <div className={`${bgColor} rounded-lg p-4 shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center text-white text-lg">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm mb-2">{title}</h3>
          <div className="text-gray-700 text-sm leading-relaxed">{content}</div>
        </div>
      </div>
    </div>
  );

  // Group curriculum by Year with inner Semester lists
  const yearsData = useMemo(() => {
    if (!department?.courses) return [];
    const entries = Object.entries(department.courses);
    const yearMap = new Map();

    const ensureYear = (label) => {
      if (!yearMap.has(label)) yearMap.set(label, []);
      return yearMap.get(label);
    };

    entries.forEach(([rawKey, value]) => {
      const yearMatch = rawKey.match(/year\s*(\d+)/i);
      const yearLabel = yearMatch ? `Year ${parseInt(yearMatch[1], 10)}` : rawKey;

      // Case 1: flat keys like "Year 1 Semester 1"
      const flatSemMatch = rawKey.match(/semester\s*(\d+)/i);
      if (flatSemMatch) {
        const semNum = parseInt(flatSemMatch[1], 10);
        const items = Array.isArray(value) ? value : [];
        ensureYear(yearLabel).push({ key: `Semester ${semNum}`, sortKey: semNum, items });
        return;
      }

      // Case 2: nested structure { 'Year 1': { 'Semester 1': [...], 'Semester 2': [...] } }
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.entries(value).forEach(([semKey, semVal]) => {
          const semNumMatch = semKey.match(/semester\s*(\d+)/i);
          const semNum = semNumMatch ? parseInt(semNumMatch[1], 10) : 0;
          const items = Array.isArray(semVal) ? semVal : [];
          ensureYear(yearLabel).push({ key: semNum ? `Semester ${semNum}` : (semKey || 'All'), sortKey: semNum, items });
        });
        return;
      }

      // Fallback: treat as 'All' for the year
      const items = Array.isArray(value) ? value : [];
      ensureYear(yearLabel).push({ key: 'All', sortKey: 0, items });
    });

    const years = Array.from(yearMap.entries()).map(([year, semesters]) => ({
      year,
      sortKey: parseInt((year.match(/\d+/) || [""])[0], 10) || 999,
      semesters: semesters.sort((a, b) => a.sortKey - b.sortKey),
    }));
    years.sort((a, b) => a.sortKey - b.sortKey);
    return years;
  }, [department]);

  const [activeYearIdx, setActiveYearIdx] = useState(0);
  const [activeSemesterKey, setActiveSemesterKey] = useState(null);
  useEffect(() => { setActiveYearIdx(0); }, [department?.id]);
  useEffect(() => {
    const sems = yearsData[activeYearIdx]?.semesters || [];
    setActiveSemesterKey(sems[0]?.key || null);
  }, [activeYearIdx, yearsData]);

  // Defer conditional rendering until after all hooks are declared
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader message="Loading department..." />
      </div>
    );
  if (error)
    return <div className="p-10 text-center text-red-600">{error}</div>;
  if (!department) return null;

  const CourseRow = ({ text, index }) => {
    // Try to parse pattern like "Course Name (3 credits) - CSE101"
    const creditsMatch = text.match(/\(([^)]+credits?)\)/i);
    const codeMatch = text.match(/\b([A-Z]{2,}[\- ]?\d{2,})\b/);
    const name = text
      .replace(creditsMatch?.[0] || "", "")
      .replace(codeMatch?.[0] || "", "")
      .replace(/\s+-\s+$/, "")
      .trim();
    const credits = creditsMatch?.[1];
    const code = codeMatch?.[1];
    return (
      <div className="flex items-start justify-between py-2 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-700 text-xs font-semibold">{index + 1}</span>
          <div>
            <div className="text-gray-800 text-sm font-medium">{name || text}</div>
            {(code || credits) && (
              <div className="text-xs text-gray-500 mt-0.5">
                {code && <span className="mr-2">Code: {code}</span>}
                {credits && <span>Credits: {credits}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 mb-10 overflow-hidden">
          <div className={`relative ${department.image_url ? 'bg-gray-800' : 'bg-slate-600'} text-white p-8 md:p-10`}>
            {/* Low-opacity background image behind title/description */}
            {department.image_url && (
              <>
                <img
                  src={department.image_url}
                  alt="bg"
                  loading="lazy"
                  className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover opacity-10"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gray-900/60" aria-hidden="true" />
              </>
            )}

            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="bg-gray-700/80 backdrop-blur rounded-full px-4 py-2 text-sm">
                  {department.affiliated_body || 'Educational Program'}
                </div>
                <div className="flex gap-2">
                  {department.duration && (
                    <span className="bg-gray-700/80 backdrop-blur rounded-full px-3 py-1 text-xs">
                      {department.duration}
                    </span>
                  )}
                  {department.estimated_fees && (
                    <span className="bg-green-600/90 rounded-full px-3 py-1 text-xs">
                      {department.estimated_fees}
                    </span>
                  )}
                </div>
              </div>

              {/* Two-column layout: image left (small), content right */}
              <div className="grid md:grid-cols-6 gap-8 items-center">
                {department.image_url && (
                  <div className="md:col-span-3 order-1">
                    <div className="w-full max-w-md mx-auto bg-gray-900/30 rounded-xl overflow-hidden shadow-xl">
                      <img
                        src={department.image_url}
                        alt={department.name}
                        loading="lazy"
                        className="w-full h-[24rem] md:h-[28rem] object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  </div>
                )}
                <div className={`${department.image_url ? 'md:col-span-3' : 'md:col-span-6'} order-2`}>
                  <h1 className="text-3xl md:text-5xl font-extrabold mb-4">{department.name}</h1>
                  <p className="text-gray-200/95 text-lg md:text-xl leading-relaxed">{department.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Information Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {department.eligibility && (
            <InfoCard
              icon="📋"
              title="Eligibility Requirements"
              content={department.eligibility}
              bgColor="bg-blue-50"
            />
          )}
          {department.duration && (
            <InfoCard
              icon="⏱️"
              title="Program Duration"
              content={department.duration}
              bgColor="bg-green-50"
            />
          )}
          {department.affiliated_body && (
            <InfoCard
              icon="🏛️"
              title="Affiliated Body"
              content={department.affiliated_body}
              bgColor="bg-purple-50"
            />
          )}
          {department.estimated_fees && (
            <InfoCard
              icon="💰"
              title="Program Investment"
              content={department.estimated_fees}
              bgColor="bg-yellow-50"
            />
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Course Curriculum - 2/3 width */}
          {yearsData.length > 0 && (
            <div className="lg:col-span-2">
                     <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center text-white text-xl mr-4">📚</div>
                    <h2 className="text-2xl font-bold text-gray-800">Course Curriculum</h2>
                  </div>
                </div>

                {/* Semester selector + content INSIDE the box */}
                <div className="mb-3 flex flex-wrap gap-2">
                                  {yearsData.map((y, idx) => (
                  <button
                    key={y.year}
                    onClick={() => setActiveYearIdx(idx)}
                    className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                      activeYearIdx === idx ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {y.year}
                  </button>
                ))}

                </div>

                <div className="rounded-lg p-3 border border-gray-200">
                                    {(yearsData[activeYearIdx]?.semesters || []).map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setActiveSemesterKey(s.key)}
                      className={`px-3 py-1.5 mx-1 mb-4 rounded-full text-xs border transition-colors ${
                        activeSemesterKey === s.key ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {s.key}
                    </button>
                  ))}
                  {(() => {
                    const sems = yearsData[activeYearIdx]?.semesters || [];
                    const current = sems.find((s) => s.key === activeSemesterKey);
                    const items = current?.items || [];
                    return items.length ? (
                      <div className="divide-y">
                        {items.map((c, i) => (
                          <CourseRow key={`${yearsData[activeYearIdx]?.year}-${activeSemesterKey}-${i}`} text={c} index={i} />
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-sm text-gray-500">No modules found for this term.</div>
                    );
                  })()}
                </div>

                {/* Note */}
                <p className="text-xs text-gray-500 mt-3">Module names and credits are indicative. Refer to official syllabus for updates.</p>
              </div>
            </div>
          )}

          {/* Side Panel - Takes 1/3 width */}
          <div className="space-y-6">
            
            {/* Career Prospects */}
            {department.career_prospects && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white text-lg mr-3">
                    💼
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Career Opportunities</h3>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {department.career_prospects}
                </p>
              </div>
            )}

            {/* Program Highlights */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Program Highlights</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm text-gray-700">Industry-focused curriculum</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm text-gray-700">Practical training & internships</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm text-gray-700">Government job eligibility</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm text-gray-700">Professional certification</span>
                </div>
              </div>
            </div>

            {/* Optional: Learning Outcomes */}
            {department.learning_outcomes && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Learning Outcomes</h3>
                <ul className="list-disc ml-5 text-sm text-gray-700 space-y-2">
                  {Array.isArray(department.learning_outcomes)
                    ? department.learning_outcomes.map((o, i) => <li key={i}>{o}</li>)
                    : String(department.learning_outcomes).split(/\s*\|\s*|\n/).map((o, i) => <li key={i}>{o}</li>)}
                </ul>
              </div>
            )}

            {/* Optional: Assessment Methods */}
            {department.assessment_methods && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Assessment Methods</h3>
                <div className="text-sm text-gray-700">
                  {typeof department.assessment_methods === 'string' ? (
                    <p>{department.assessment_methods}</p>
                  ) : (
                    <ul className="list-disc ml-5 space-y-1">
                      {Object.entries(department.assessment_methods).map(([k, v], i) => (
                        <li key={i}><span className="font-medium">{k}:</span> {v}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Financial Aid Info moved next to CTA below */}
          </div>
        </div>

        {/* Call to Action + Financials side-by-side */}
        <div className="mt-12">
          <div className="grid lg:grid-cols-4 gap-8 items-stretch">
            {/* CTA - left, wider */}
            <div className="lg:col-span-3">
              <div className="rounded-xl shadow-lg border border-indigo-100 p-8 text-center lg:text-left h-full flex flex-col justify-center bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Begin Your Journey?</h3>
                <p className="text-gray-700 mb-6 max-w-2xl mx-auto lg:mx-0">
                  Join thousands of successful graduates who have built rewarding careers through our comprehensive {department.name} program.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 shadow-md">
                    Apply Now
                  </button>
                  <button className="border-2 border-indigo-600 text-indigo-700 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors duration-200">
                    Download Brochure
                  </button>
                  <button className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 shadow-md">
                    Contact Admissions
                  </button>
                </div>
              </div>
            </div>

            {/* Financial Information - right */}
            {department.estimated_fees && (
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-6 h-full">
                <h3 className="text-lg font-bold text-green-800 mb-3">Financial Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-700">Total Investment:</span>
                    <span className="text-lg font-bold text-green-800">{department.estimated_fees}</span>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-green-700">
                      💡 Scholarships available for deserving students. Payment plans accepted.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DepartmentDetail;