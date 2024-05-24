const cleanInstructions = (input, instructions) => {
  return input.replace(instructions, "").trim();
};

export { cleanInstructions };
