// pages/Project/ProjectDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Messages from "../Chat/RightParts/Messages.jsx";
import Typesend from "../Chat/RightParts/Typesend.jsx";
import ProjectCommit from "./ProjectCommit.jsx";
import axios from "axios";

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:3001/api/project/${id}`);
        setProject(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!project) return <p>Project not found</p>;

  return (
    <div className="flex h-screen bg-[#050B18] text-white">
      {/* Project Sidebar (optional) */}
      <div className="w-[300px] border-r border-[#1C2333] p-4">
        <h2 className="text-xl font-bold">{project.projectName}</h2>
        <p className="text-gray-400">{project.description}</p>
        <div className="mt-4">
          <h3 className="text-sm text-gray-400 mb-2">Members</h3>
          {project.members?.map((mem, i) => (
            <p key={i} className="text-gray-200 text-sm">{mem}</p>
          ))}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col">
        <ProjectCommit projectId={id} githubData={project.githubData} />
        <Messages projectId={id} />
        <Typesend projectId={id} />
      </div>
    </div>
  );
}