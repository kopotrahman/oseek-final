import { useState } from "react"
import Header from "../../components/Header"
import { Plus, Trash2 } from "lucide-react"

export default function JobSeekerProfile() {
  const [profile, setProfile] = useState({
    fullName: "John Doe",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    headline: "Full Stack Developer",
    bio: "Passionate about building scalable web applications",
    skills: ["React", "Node.js", "MongoDB", "TailwindCSS"],
    experience: [
      {
        id: 1,
        title: "Senior Developer",
        company: "Tech Corp",
        duration: "2021 - Present",
        description: "Led development of multiple projects",
      },
    ],
    education: [
      {
        id: 1,
        school: "University of Tech",
        degree: "BS Computer Science",
        year: "2019",
      },
    ],
  })

  const [newSkill, setNewSkill] = useState("")

  const addSkill = () => {
    if (newSkill.trim()) {
      setProfile({
        ...profile,
        skills: [...profile.skills, newSkill],
      })
      setNewSkill("")
    }
  }

  const removeSkill = (index) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter((_, i) => i !== index),
    })
  }

  const downloadCV = () => {
    const cvContent = `
${profile.fullName}
${profile.headline}
${profile.email} | ${profile.phone} | ${profile.location}

PROFESSIONAL SUMMARY
${profile.bio}

SKILLS
${profile.skills.join(", ")}

EXPERIENCE
${profile.experience.map((exp) => `${exp.title} at ${exp.company} (${exp.duration})\n${exp.description}`).join("\n\n")}

EDUCATION
${profile.education.map((edu) => `${edu.degree} from ${edu.school} (${edu.year})`).join("\n")}
`
    const blob = new Blob([cvContent], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "CV.txt"
    a.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f1e] via-[#1a1a2e] to-[#0f0f1e]">
      <Header />
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-[#16213e] border border-[#2d2d4d] rounded-2xl p-8 neon-glow">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-[#e0e0ff]">My Profile</h1>
            <button
              onClick={downloadCV}
              className="px-6 py-2 bg-[#00d9ff] text-[#0f0f1e] rounded-lg font-semibold hover:bg-[#00b8d4] transition"
            >
              Download CV
            </button>
          </div>

          {/* Personal Info */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#e0e0ff] mb-4">Personal Information</h2>
            <div className="bg-[#0f0f1e] rounded-lg p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[#a0a0c0] text-sm font-medium">Full Name</label>
                  <p className="text-[#e0e0ff] text-lg">{profile.fullName}</p>
                </div>
                <div>
                  <label className="text-[#a0a0c0] text-sm font-medium">Headline</label>
                  <p className="text-[#e0e0ff] text-lg">{profile.headline}</p>
                </div>
                <div>
                  <label className="text-[#a0a0c0] text-sm font-medium">Email</label>
                  <p className="text-[#e0e0ff] text-lg">{profile.email}</p>
                </div>
                <div>
                  <label className="text-[#a0a0c0] text-sm font-medium">Location</label>
                  <p className="text-[#e0e0ff] text-lg">{profile.location}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#e0e0ff] mb-4">Skills</h2>
            <div className="bg-[#0f0f1e] rounded-lg p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.skills.map((skill, idx) => (
                  <div key={idx} className="bg-[#0066ff] text-white px-4 py-2 rounded-full flex items-center gap-2">
                    {skill}
                    <button onClick={() => removeSkill(idx)} className="hover:text-[#00d9ff]">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill"
                  className="flex-1 bg-[#16213e] border border-[#2d2d4d] rounded-lg px-4 py-2 text-[#e0e0ff] placeholder-[#6d6d8f] focus:border-[#0066ff] focus:outline-none"
                />
                <button
                  onClick={addSkill}
                  className="px-4 py-2 bg-[#00d9ff] text-[#0f0f1e] rounded-lg font-semibold hover:bg-[#00b8d4] transition flex items-center gap-2"
                >
                  <Plus size={20} /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Experience */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#e0e0ff] mb-4">Experience</h2>
            <div className="space-y-4">
              {profile.experience.map((exp) => (
                <div key={exp.id} className="bg-[#0f0f1e] rounded-lg p-6 border border-[#2d2d4d]">
                  <h3 className="text-xl font-bold text-[#e0e0ff]">{exp.title}</h3>
                  <p className="text-[#00d9ff]">{exp.company}</p>
                  <p className="text-[#a0a0c0] text-sm">{exp.duration}</p>
                  <p className="text-[#e0e0ff] mt-2">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <h2 className="text-2xl font-bold text-[#e0e0ff] mb-4">Education</h2>
            <div className="space-y-4">
              {profile.education.map((edu) => (
                <div key={edu.id} className="bg-[#0f0f1e] rounded-lg p-6 border border-[#2d2d4d]">
                  <h3 className="text-xl font-bold text-[#e0e0ff]">{edu.degree}</h3>
                  <p className="text-[#00d9ff]">{edu.school}</p>
                  <p className="text-[#a0a0c0] text-sm">{edu.year}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
