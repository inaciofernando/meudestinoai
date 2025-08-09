import React from "react";
import { Navigate, useParams } from "react-router-dom";

const DocumentosRedirect: React.FC = () => {
  const { id } = useParams();
  if (!id) return <Navigate to="/" replace />;
  return <Navigate to={`/viagem/${id}/documentos`} replace />;
};

export default DocumentosRedirect;
