import React from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

interface NavBarProps {
  title: string;
  showBackButton?: boolean;
  rightElement?: React.ReactNode;
  onBack?: () => void;
  className?: string;
}

const NavBar: React.FC<NavBarProps> = ({
  title,
  showBackButton = true,
  rightElement,
  onBack,
  className = "",
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className={`w-full bg-white border-b pb-2 mb-4 ${className}`}>
      <div className="px-4 flex items-center justify-between">
        {showBackButton ? (
          <button onClick={handleBack} className="cursor-pointer">
            <FontAwesomeIcon
              icon={faArrowLeft}
              className="text-xl text-gray-600"
            />
          </button>
        ) : (
          <div className="w-8"></div>
        )}
        <h1 className="text-lg font-medium">{title}</h1>
        {rightElement || <div className="w-8"></div>}
      </div>
    </div>
  );
};

export default NavBar;
