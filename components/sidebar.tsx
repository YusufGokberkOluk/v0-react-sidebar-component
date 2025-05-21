import type React from "react"

interface Workspace {
  id: string
  name: string
}

interface SidebarProps {
  workspaces: Workspace[]
}

const Sidebar: React.FC<SidebarProps> = ({ workspaces }) => {
  return (
    <div className="w-64 bg-white h-screen shadow-md flex flex-col">
      {/* Workspace başlığı - dropdown yerine sabit başlık */}
      <div className="p-4 border-b border-gray-200">
        {workspaces.length > 0 ? (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-md bg-[#79B791] flex items-center justify-center text-white font-semibold">
              {workspaces[0].name.charAt(0)}
            </div>
            <h2 className="text-lg font-semibold text-[#13262F]">{workspaces[0].name}</h2>
          </div>
        ) : (
          <div className="h-8 w-full bg-gray-200 animate-pulse rounded-md"></div>
        )}
      </div>

      <nav className="flex-1 p-4">
        <ul>
          <li className="mb-2">
            <a href="#" className="block p-2 rounded hover:bg-gray-100 text-[#13262F]">
              Dashboard
            </a>
          </li>
          <li className="mb-2">
            <a href="#" className="block p-2 rounded hover:bg-gray-100 text-[#13262F]">
              Projects
            </a>
          </li>
          <li className="mb-2">
            <a href="#" className="block p-2 rounded hover:bg-gray-100 text-[#13262F]">
              Tasks
            </a>
          </li>
          {/* Add more navigation items here */}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <a href="#" className="block p-2 rounded hover:bg-gray-100 text-[#13262F]">
          Settings
        </a>
        <a href="#" className="block p-2 rounded hover:bg-gray-100 text-[#13262F]">
          Logout
        </a>
      </div>
    </div>
  )
}

export default Sidebar
