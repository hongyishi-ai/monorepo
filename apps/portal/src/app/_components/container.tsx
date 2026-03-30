type Props = {
  children?: React.ReactNode;
};

const Container = ({ children }: Props) => {
  return <div className="container mx-auto px-6 md:px-8">{children}</div>;
};

export default Container;
