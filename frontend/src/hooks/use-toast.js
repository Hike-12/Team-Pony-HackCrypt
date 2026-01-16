import { toast as sonnerToast } from "sonner";

export const useToast = () => {
  const toast = ({ title, description, variant, duration = 5000 }) => {
    if (variant === "destructive") {
      sonnerToast.error(title, {
        description,
        duration,
      });
    } else {
      sonnerToast.success(title, {
        description,
        duration,
      });
    }
  };

  return { toast };
};
