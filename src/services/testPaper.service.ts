import api from "../config/api";

export interface TestPaper {
  _id: string;
  title: string;
  subject: string;
  totalMarks: number;
  createdAt: string;
}

export const getTestPapers = async (): Promise<TestPaper[]> => {
  const response = await api.get<TestPaper[]>("/test-papers");
  return response.data;
};

export const createTestPaper = async (data: {
  title: string;
  subject: string;
  totalMarks: number;
}): Promise<TestPaper> => {
  const response = await api.post<TestPaper>("/test-papers", data);
  return response.data;
};
