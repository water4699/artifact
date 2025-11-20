import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedEncryptedArtifactVoting = await deploy("EncryptedArtifactVoting", {
    from: deployer,
    log: true,
  });

  console.log(`EncryptedArtifactVoting contract: `, deployedEncryptedArtifactVoting.address);
};
export default func;
func.id = "deploy_encrypted_artifact_voting"; // id required to prevent reexecution
func.tags = ["EncryptedArtifactVoting"];
