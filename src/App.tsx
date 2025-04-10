import React, { useState } from 'react';
import { Calculator, Binary, Network, Globe2 } from 'lucide-react';

interface IPAddress {
  octets: number[];
  cidr: number;
}

function App() {
  const [ipAddress, setIpAddress] = useState<IPAddress>({
    octets: [192, 168, 1, 1],
    cidr: 24
  });
  const [error, setError] = useState<string>('');

  const validateIP = (ip: string): boolean => {
    const octets = ip.split('.');
    if (octets.length !== 4) return false;
    return octets.every(octet => {
      const num = parseInt(octet);
      return num >= 0 && num <= 255;
    });
  };

  const handleIPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setIpAddress({ ...ipAddress, octets: [0, 0, 0, 0] });
      setError('');
      return;
    }

    if (!validateIP(value)) {
      setError('Invalid IP address format');
      return;
    }

    setError('');
    const newOctets = value.split('.').map(o => parseInt(o));
    setIpAddress({ ...ipAddress, octets: newOctets });
  };

  const handleCIDRChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 0 && value <= 32) {
      setIpAddress({ ...ipAddress, cidr: value });
      setError('');
    } else {
      setError('CIDR must be between 0 and 32');
    }
  };

  const calculateSubnetMask = (): string => {
    const mask = new Array(4).fill(0);
    const fullOctets = Math.floor(ipAddress.cidr / 8);
    const remainingBits = ipAddress.cidr % 8;

    for (let i = 0; i < fullOctets; i++) {
      mask[i] = 255;
    }

    if (remainingBits > 0) {
      mask[fullOctets] = 256 - Math.pow(2, 8 - remainingBits);
    }

    return mask.join('.');
  };

  const toBinary = (num: number): string => {
    return num.toString(2).padStart(8, '0');
  };

  const getNetworkAddress = (): string => {
    const mask = calculateSubnetMask().split('.').map(n => parseInt(n));
    return ipAddress.octets.map((octet, i) => octet & mask[i]).join('.');
  };

  const getBroadcastAddress = (): string => {
    const mask = calculateSubnetMask().split('.').map(n => parseInt(n));
    return ipAddress.octets.map((octet, i) => octet | (255 - mask[i])).join('.');
  };

  const getAvailableHosts = (): number => {
    return Math.pow(2, 32 - ipAddress.cidr) - 2;
  };

  const getIPClass = (): string => {
    const firstOctet = ipAddress.octets[0];
    if (firstOctet >= 1 && firstOctet <= 126) return 'A';
    if (firstOctet >= 128 && firstOctet <= 191) return 'B';
    if (firstOctet >= 192 && firstOctet <= 223) return 'C';
    if (firstOctet >= 224 && firstOctet <= 239) return 'D (Multicast)';
    if (firstOctet >= 240 && firstOctet <= 255) return 'E (Reserved)';
    return 'Invalid';
  };

  const isPrivateIP = (): boolean => {
    const [first, second] = ipAddress.octets;
    return (
      (first === 10) || // Class A private
      (first === 172 && second >= 16 && second <= 31) || // Class B private
      (first === 192 && second === 168) // Class C private
    );
  };

  const getUsableRange = (): { first: string; last: string } => {
    const networkAddr = getNetworkAddress().split('.').map(n => parseInt(n));
    const broadcastAddr = getBroadcastAddress().split('.').map(n => parseInt(n));
    
    // First usable address is network address + 1 in last octet
    const firstUsable = [...networkAddr];
    firstUsable[3] += 1;
    
    // Last usable address is broadcast address - 1 in last octet
    const lastUsable = [...broadcastAddr];
    lastUsable[3] -= 1;
    
    return {
      first: firstUsable.join('.'),
      last: lastUsable.join('.')
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <Calculator className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold">IP Calculator</h1>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              IP Address
            </label>
            <input
              type="text"
              value={ipAddress.octets.join('.')}
              onChange={handleIPChange}
              placeholder="192.168.1.1"
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              CIDR Notation
            </label>
            <input
              type="number"
              value={ipAddress.cidr}
              onChange={handleCIDRChange}
              min="0"
              max="32"
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm font-medium">{error}</div>
          )}

          <div className="mt-8 space-y-4 bg-gray-900 rounded-lg p-6">
            <div className="flex items-center gap-2">
              <Binary className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold">Network Information</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-gray-400">Subnet Mask</p>
                <p className="font-mono">{calculateSubnetMask()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-400">Network Address</p>
                <p className="font-mono">{getNetworkAddress()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-400">Broadcast Address</p>
                <p className="font-mono">{getBroadcastAddress()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-400">Available Hosts</p>
                <p className="font-mono">{getAvailableHosts().toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold">Address Range</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-gray-400">First Usable Address</p>
                  <p className="font-mono">{getUsableRange().first}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-400">Last Usable Address</p>
                  <p className="font-mono">{getUsableRange().last}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold">IP Classification</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-gray-400">IP Class</p>
                  <p className="font-mono">{getIPClass()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-400">Address Type</p>
                  <p className="font-mono">{isPrivateIP() ? 'Private' : 'Public'}</p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-gray-400 mb-2">Binary Representation</p>
              <div className="font-mono text-sm break-all">
                {ipAddress.octets.map(octet => toBinary(octet)).join('.')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;