import { Bell } from "lucide-react";
import { useUser } from "../hooks/useUser";

type UserRole = "DRIVER" | "PARENT" | "SCHOOL_ADMIN" | "SUPER_ADMIN";

interface TopNavProps {
  role: UserRole;
}

const TopNav: React.FC<TopNavProps> = ({ role }) => {
  const { userData, loading } = useUser();
  // Define role-based display data
  const roleConfig = {
    SUPER_ADMIN: { title: "System Overview", userTitle: "Super Administrator" },
    SCHOOL_ADMIN: {
      title: "School Overview",
      userTitle: "School Administrator",
    },
    DRIVER: { title: "Route Dashboard", userTitle: "Transit Driver" },
    PARENT: { title: "Student Tracking", userTitle: "Parent Account" },
  };

  const { title, userTitle } = roleConfig[role];
  const userName = loading ? "Loading..." : userData?.name || "User";

  return (
    <nav className="h-16 bg-white border-b border-gray-100 px-8 flex items-center justify-between shrink-0">
      {/* Dynamic Page Title */}
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-[#1d1c1d] tracking-tight">
          {title}
        </h1>
      </div>

      {/* Actions & Profile Section */}
      <div className="flex items-center gap-2">
        <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-full relative transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
        </button>

        <div className="w-px h-8 bg-gray-200 mx-2" />

        <div className="flex items-center gap-3 pl-2 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#1d1c1d] leading-none">
              {userName}
            </p>
            <p className="text-[10px] text-gray-500 mt-1 font-medium uppercase tracking-wider">
              {userTitle}
            </p>
          </div>

          {/* Dynamic Avatar */}
          <div className="relative">
            <img
              src={`https://ui-avatars.com/api/?name=${userName.replace(" ", "+")}&background=3b82f6&color=fff`}
              alt="User profile"
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
