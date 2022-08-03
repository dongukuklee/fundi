export const sortOptionCreator = (key: string | undefined | null) => {
  switch (key) {
    case "popularity":
      return {
        likedUser: {
          _count: "desc",
        },
      };
    case "latest":
      return {
        createdAt: "desc",
      };
    default:
      return {
        createdAt: "desc",
      };
  }
};
