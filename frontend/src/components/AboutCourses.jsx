import React from 'react';

const AboutCourses = () => {
    const branches = [
        {
            name: 'Computer Science & Engineering',
            code: 'CSE',
            placement: '98%',
            capacity: 120,
            syllabus: '#',
            description: 'Focuses on computation, programming, algorithms, and data structures. Highly sought after with top placements in global tech giants.',
            color: '#6366f1'
        },
        {
            name: 'Information Technology',
            code: 'IT',
            placement: '96%',
            capacity: 120,
            syllabus: '#',
            description: 'Emphasis on software development, networking, and information systems. Excellent industry demand and career growth.',
            color: '#3b82f6'
        },
        {
            name: 'Artificial Intelligence & Machine Learning',
            code: 'AIML',
            placement: '97%',
            capacity: 60,
            syllabus: '#',
            description: 'Cutting-edge branch focusing on intelligent systems, neural networks, and advanced data analytics.',
            color: '#8b5cf6'
        },
        {
            name: 'Electrical Engineering',
            code: 'EE',
            placement: '85%',
            capacity: 120,
            syllabus: '#',
            description: 'Deals with the study of electricity, electronics, and electromagnetism. Core branch with diverse opportunities in power and energy sectors.',
            color: '#f59e0b'
        },
        {
            name: 'Electronics & Telecommunication',
            code: 'ETC',
            placement: '88%',
            capacity: 120,
            syllabus: '#',
            description: 'Covers electronic circuits, communication systems, and signal processing. Essential for the hardware and telecom industries.',
            color: '#ec4899'
        },
        {
            name: 'Mechanical Engineering',
            code: 'ME',
            placement: '82%',
            capacity: 120,
            syllabus: '#',
            description: 'Focuses on design, analysis, and manufacturing of mechanical systems. Versatile branch with applications in automotive, aerospace, and robotics.',
            color: '#10b981'
        },
        {
            name: 'Civil Engineering',
            code: 'CE',
            placement: '78%',
            capacity: 120,
            syllabus: '#',
            description: 'Involves planning, design, and construction of infrastructure like buildings, bridges, and roads.',
            color: '#64748b'
        },
        {
            name: 'Biotechnology',
            code: 'BT',
            placement: '80%',
            capacity: 60,
            syllabus: '#',
            description: 'Combines biology with technology for applications in healthcare, agriculture, and environment.',
            color: '#f43f5e'
        }
    ];

    return (
        <div className="animate-fadeIn pb-5">
            <div className="mb-5">
                <h3 className="fw-bold text-dark mb-2">
                    <i className="bi bi-info-circle-fill me-2 text-primary"></i>
                    Academic Branches at OUTR
                </h3>
                <p className="text-muted">Explore detailed information about our engineering programs, placement statistics, and capacities.</p>
            </div>

            <div className="row g-4">
                {branches.map((branch, index) => (
                    <div key={index} className="col-md-6 col-xxl-4">
                        <div className="card h-100 border-0 shadow-sm hover-shadow transition-all" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                            <div style={{ height: '8px', background: branch.color }}></div>
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <span className="badge" style={{ background: `${branch.color}15`, color: branch.color, fontWeight: '800', padding: '6px 12px', borderRadius: '8px' }}>
                                        {branch.code}
                                    </span>
                                    <div className="text-muted small fw-bold">
                                        <i className="bi bi-people-fill me-1"></i> {branch.capacity} Seats
                                    </div>
                                </div>
                                <h5 className="fw-bold text-dark mb-3" style={{ fontSize: '1.25rem' }}>{branch.name}</h5>
                                <p className="text-muted small mb-4" style={{ lineHeight: '1.6', minHeight: '4.8rem' }}>
                                    {branch.description}
                                </p>
                                
                                <div className="p-3 rounded-4 mb-4" style={{ background: '#f8fafc' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-muted small fw-semibold">Placement Rate</span>
                                        <span className="fw-bold text-dark">{branch.placement}</span>
                                    </div>
                                    <div className="progress" style={{ height: '6px', borderRadius: '10px' }}>
                                        <div 
                                            className="progress-bar" 
                                            style={{ 
                                                width: branch.placement, 
                                                background: branch.color,
                                                borderRadius: '10px'
                                            }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="d-flex gap-2">
                                    <a href={branch.syllabus} className="btn w-100 fw-bold py-2" style={{ 
                                        borderRadius: '12px', 
                                        background: '#f1f5f9', 
                                        color: '#334155',
                                        border: 'none',
                                        fontSize: '0.85rem'
                                    }}>
                                        <i className="bi bi-file-earmark-text me-2"></i>Syllabus
                                    </a>
                                    <button className="btn w-100 fw-bold py-2" style={{ 
                                        borderRadius: '12px', 
                                        background: `${branch.color}10`, 
                                        color: branch.color,
                                        border: `1px solid ${branch.color}30`,
                                        fontSize: '0.85rem'
                                    }}>
                                        Learn More
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AboutCourses;
